import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { EC2Stack } from "./stacks/ec2";
import { CodePipelineStack } from "./stacks/code-pipeline";
import { AppStack } from "./stacks/app";

export interface DocaiEnterpriseSystemProps extends cdk.StageProps {}

export interface SetupResourceStageProps extends cdk.StackProps {
  AppStack?: AppStack;
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
    stackProps.AppStack = new AppStack(this, "AppStack", stackProps);
    stackProps.codePipelineStack = new CodePipelineStack(
      this,
      "CodePipelineStack",
      stackProps
    );
  }
}
