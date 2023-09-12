import * as cdk from "aws-cdk-lib";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { VPCResources } from "../resources/vpc";
import { ServerResources } from "../resources/server";

export interface EC2StackProps extends StackProps {}

export class EC2Stack extends Stack {
  constructor(scope: Construct, id: string, props: EC2StackProps) {
    super(scope, id, props);

    // VPC
    const vpcResources = new VPCResources(this, "vpc");

    // EC2 Instance
    const serverResources = new ServerResources(this, "server", {
      vpc: vpcResources.vpc,
      webSg: vpcResources.webSg,
    });

    // Output the public IP address of the EC2 instance
    new cdk.CfnOutput(this, "IP Address", {
      value: serverResources.instance.instancePublicIp,
    });
  }
}
