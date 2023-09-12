import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { EC2Stack } from "./stacks/ec2";
import { CodePipelineStack } from "./stacks/code-pipeline";

export interface DocaiEnterpriseSystemProps extends cdk.StageProps {}

export interface SetupResourceStageProps extends cdk.StackProps {
  ec2Stack?: EC2Stack;
  codePipelineStack?: CodePipelineStack;
}

export class SetupResourceStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: DocaiEnterpriseSystemProps) {
    super(scope, id, props);

    const stackProps: SetupResourceStageProps = {
      env: props.env,
    };

    // stacks
    stackProps.ec2Stack = new EC2Stack(this, "EC2Stack", stackProps);
    stackProps.codePipelineStack = new CodePipelineStack(
      this,
      "CodePipelineStack",
      stackProps
    );
  }
}
