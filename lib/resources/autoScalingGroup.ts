/* eslint-disable import/no-extraneous-dependencies */
import * as cdk from "aws-cdk-lib";
import {
  Vpc,
  SecurityGroup,
  InstanceType,
  InstanceClass,
  InstanceSize,
  AmazonLinuxCpuType,
  AmazonLinuxImage,
  AmazonLinuxGeneration,
  UserData,
} from "aws-cdk-lib/aws-ec2";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
import { Role, ServicePrincipal, ManagedPolicy } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface ASGProps {
  vpc: Vpc;
  webSg: SecurityGroup;
}

export class ASGResources extends Construct {
  public asg: AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ASGProps) {
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

    // ASG EC2 Instance
    // This is the Python Web server that we will be using
    // Get the latest AmazonLinux 2 AMI for the given region
    const ami = new AmazonLinuxImage({
      generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: AmazonLinuxCpuType.X86_64,
    });

    this.asg = new AutoScalingGroup(this, "asg", {
      vpc: props.vpc,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      machineImage: ami,
      userData,
      securityGroup: props.webSg,
      role: webServerRole,
      minCapacity: 1,
      maxCapacity: 1,
    });
    cdk.Tags.of(this.asg).add("application-name", "python-web");
    cdk.Tags.of(this.asg).add("stage", "prod");
  }
}
