import { ValidatorFn } from '@angular/forms';

export interface Field {
  type: FieldType;
  name: string;
  label?: string;
  placeholder?: string;
  validator?: ValidatorFn[];
  attrs?: any;
  inputValues?: MultiSelectField[];
  selectValues?: MultiSelectField[];
}

export type FieldType = 'INPUT' | 'TEXTAREA' | 'SELECT';

export interface Errors {
  [key: string]: string;
}

export interface MultiSelectField {
  label: string;
  value: string;
}
