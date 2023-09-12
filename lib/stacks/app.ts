import * as cdk from "aws-cdk-lib";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { VPCResources } from "../resources/vpc";
import { ServerResources } from "../resources/server";
import { ASGResources } from "../resources/autoScalingGroup";
import { ALBResources } from "../resources/alb";

export interface AppStackProps extends StackProps {}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    // VPC
    const vpcResources = new VPCResources(this, "vpc");

    //  ASG Instances
    const aSGResources = new ASGResources(this, "ASG", {
      vpc: vpcResources.vpc,
      webSg: vpcResources.webSg,
    });

    // ALB
    const albResources = new ALBResources(this, "ALB", {
      vpc: vpcResources.vpc,
      target: aSGResources.asg,
    });

    // Output the ALB's URL
    new cdk.CfnOutput(this, "LoadBalancerURL", {
      value: `http://${albResources.alb.loadBalancerDnsName}`,
    });
  }
}
