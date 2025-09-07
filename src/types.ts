export interface Dependency {
  name: string;
  type: DependencyType;
}

export enum DependencyType {
  ApexClass = 'ApexClass',
  CustomObject = 'CustomObject',
  SystemType = 'SystemType',
  Trigger = 'Trigger',
  TriggerField = 'TriggerField',
  CustomField = 'CustomField',
  CustomLabel = 'CustomLabel',
  CustomValidationRule = 'CustomValidationRule',
  CustomApplication = 'CustomApplication',
  CustomPage = 'CustomPage',
  ApexInterface = 'ApexInterface',
  ApexEnum = 'ApexEnum',
  ApexTrigger = 'ApexTrigger',
  ApexPage = 'ApexPage',
  ApexComponent = 'ApexComponent',
  ApexPageComponent = 'ApexPageComponent',
  ApexPageSection = 'ApexPageSection',
  ApexPageRegion = 'ApexPageRegion',
  ApexPageItem = 'ApexPageItem',
  ApexPageWebLink = 'ApexPageWebLink'
}

export interface AnalysisResult {
  rootObject: string;
  rootType: DependencyType;
  dependencies: Dependency[];
}