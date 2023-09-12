/* eslint-disable import/no-extraneous-dependencies */
import * as cdk from "aws-cdk-lib";
import {
  Vpc,
  SecurityGroup,
  Instance,
  InstanceType,
  InstanceClass,
  InstanceSize,
  AmazonLinuxCpuType,
  AmazonLinuxImage,
  AmazonLinuxGeneration,
  UserData,
} from "aws-cdk-lib/aws-ec2";
import { Role, ServicePrincipal, ManagedPolicy } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { readFileSync } from "fs";

interface ServerProps {
  vpc: Vpc;
  webSg: SecurityGroup;
}

export class ServerResources extends Construct {
  public instance: Instance;

  constructor(scope: Construct, id: string, props: ServerProps) {
    super(scope, id);

    // IAM
    // Policy for CodeDeploy bucket access
    // Role that will be attached to the EC2 instance so it can be
    // managed by AWS SSM
    const webServerRole = new Role(this, "ec2Role", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
    });

    // IAM policy attachment to allow access to
    webServerRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    webServerRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonEC2RoleforAWSCodeDeploy"
      )
    );

    // User data - used for bootstrapping
    // The user data is used to bootstrap the EC2 instance and install specific application packages on the instance's first boot.
    const userData = UserData.forLinux();
    userData.addCommands(
      // Install OS packages
      `yum update -y`,
      `yum groupinstall -y "Development Tools"`,
      `amazon-linux-extras install -y nginx1`,
      `yum install -y nginx python3 python3-pip python3-devel ruby wget`,
      `pip3 install pipenv wheel`,
      `pip3 install uwsgi`,

      // Code Deploy Agent
      `cd /home/ec2-user`,
      `wget https://aws-codedeploy-us-west-2.s3.us-west-2.amazonaws.com/latest/install`,
      `chmod +x ./install`,
      `sudo ./install auto`
    );

    // EC2 Instance
    // This is the Python Web server that we will be using
    // Get the latest AmazonLinux 2 AMI for the given region
    const ami = new AmazonLinuxImage({
      generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: AmazonLinuxCpuType.X86_64,
    });

    // The actual Web EC2 Instance for the web server
    const webServer = new Instance(this, "web_server", {
      vpc: props.vpc,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      machineImage: ami,
      securityGroup: props.webSg,
      role: webServerRole,
      userData: userData,
    });
    // Tag the instance
    // The tags are used by Systems Manager to identify the instance later on for deployments.
    cdk.Tags.of(webServer).add("application-name", "python-web");
    cdk.Tags.of(webServer).add("stage", "prod");
  }
}
