import * as cdk from "aws-cdk-lib";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Instance, Vpc } from "aws-cdk-lib/aws-ec2";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";

export interface ALBStackProps extends StackProps {
  vpc: Vpc;
  target: AutoScalingGroup;
}

export class ALBStack extends Stack {
  constructor(scope: Construct, id: string, props: ALBStackProps) {
    super(scope, id, props);

    // Create an Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, "MyALB", {
      vpc: props.vpc,
      internetFacing: true,
    });

    const listener = alb.addListener("MyListener", {
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

    // Output the ALB's URL
    new cdk.CfnOutput(this, "LoadBalancerURL", {
      value: `http://${alb.loadBalancerDnsName}`,
    });
  }
}
