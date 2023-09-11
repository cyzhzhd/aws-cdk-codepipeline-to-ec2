import { readFileSync } from "fs";
import {
  Vpc,
  SubnetType,
  Peer,
  Port,
  AmazonLinuxGeneration,
  AmazonLinuxCpuType,
  Instance,
  SecurityGroup,
  AmazonLinuxImage,
  InstanceClass,
  InstanceSize,
  InstanceType,
} from "aws-cdk-lib/aws-ec2";
import { Role, ServicePrincipal, ManagedPolicy } from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class Ec2CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * AWS Systems Manager & AWS CodeDeploy와 연동하기 위한 IAM role 생성
     * */

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

    // This VPC has 3 public subnets, and that's it
    const vpc = new Vpc(this, "main_vpc", {
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "pub01",
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "pub02",
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "pub03",
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    // Security Group
    // THis SG will only allow HTTP traffic to the Web server
    const webSg = new SecurityGroup(this, "web_sg", {
      vpc,
      description: "Allow Inbound HTTP traffic to the web server",
      allowAllOutbound: true,
    });
    webSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80));

    // the AMI to be used for the EC2 Instance
    const ami = new AmazonLinuxImage({
      generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: AmazonLinuxCpuType.X86_64,
    });

    // The actual WEb EC2 Instacne for the web server
    const webServer = new Instance(this, "web_server", {
      vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: ami,
      securityGroup: webSg,
      role: webServerRole,
    });

    // User data - used for bootstrapping
    // The user data is used to bootstrap the EC2 instance and install specific application packages on the instance's first boot.
    const webSGUData = readFileSync(
      "./assets/configure_amz_linux_sample_app.sh",
      "utf-8"
    );
    webServer.addUserData(webSGUData);
    // Tag the instance
    // The tags are used by Systems Manager to identify the instance later on for deployments.
    cdk.Tags.of(webServer).add("application-name", "python-web");
    cdk.Tags.of(webServer).add("stage", "prod");

    // Output the public IP address of the EC2 instance
    new cdk.CfnOutput(this, "IP Address", {
      value: webServer.instancePublicIp,
    });
  }
}
