import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";

export interface ALBResourcesProps {
  vpc: Vpc;
  target: AutoScalingGroup;
}

export class ALBResources extends Construct {
  public alb: elbv2.ApplicationLoadBalancer;
  constructor(scope: Construct, id: string, props: ALBResourcesProps) {
    super(scope, id);

    // Create an Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, "MyALB", {
      vpc: props.vpc,
      internetFacing: true,
    });

    const listener = this.alb.addListener("MyListener", {
      port: 80,
      open: true,
    });

    listener.addTargets("default-target", {
      port: 80,
      targets: [props.target],
      healthCheck: {
        path: "/",
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 5,
        interval: cdk.Duration.seconds(30),
      },
    });
  }
}
