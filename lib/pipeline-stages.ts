import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { EC2Stack } from "./stacks/ec2";

export interface DocaiEnterpriseSystemProps extends cdk.StageProps {}

export interface DocaiEnterpriseStackProps extends cdk.StackProps {
  ec2Stack?: EC2Stack;
}

export class DocaiEnterpriseSystem extends cdk.Stage {
  constructor(scope: Construct, id: string, props: DocaiEnterpriseSystemProps) {
    super(scope, id, props);

    const stackProps: DocaiEnterpriseStackProps = {
      env: props.env,
    };

    // stacks for docai enterprise
    stackProps.ec2Stack = new EC2Stack(this, "EC2Stack", stackProps);
  }
}
