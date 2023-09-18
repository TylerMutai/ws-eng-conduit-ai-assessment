import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Field, MultiSelectField} from '../../+state/forms.interfaces';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'cdt-input',
  standalone: true,
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css'],
  imports: [ReactiveFormsModule, NgForOf, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent {
  @Input() field!: Field;
  @Input() group!: FormGroup;

  shouldShowSearch: boolean

  searchResults: MultiSelectField[]

  constructor(private fb: FormBuilder) {
    this.shouldShowSearch = false;
    this.searchResults = this.field?.selectValues || [];
  }

  values(): FormArray {
    const arr = this.group.get(this.field?.name)
    if (!arr) {
      this.group.addControl(this.field?.name, this.fb.array([]))
    }
    return this.group.get(this.field?.name) as FormArray
  }

  addValue(value: MultiSelectField) {
    let hasValue = false;
    for (let i = 0; i < this.values().length; i++) {
      const val = this.values().at(i);
      if (val.value?.value === value.value) {
        hasValue = true;
        break;
      }
    }
    if (!hasValue) {
      this.values().push(this.fb.control(value));
    }
    this.shouldShowSearch = false;
  }

  removeValue(val: MultiSelectField) {
    let index = -1;
    for (let i = 0; i < this.values().length; i++) {
      if (this.values().at(i)?.value === val?.value) {
        index = i;
        break
      }
    }
    if (index >= 0) {
      this.values().removeAt(index);
    }
  }

  onInputChange(e: any) {
    this.shouldShowSearch = true;
    this.searchResults = this.field.selectValues?.filter(v => `${v.label}`?.toLocaleLowerCase()?.includes(e.target.value)) || [];
  }

  onInputFocusIn() {
    this.shouldShowSearch = true;
    this.searchResults = this.field?.selectValues || [];
  }

  onInputFocusOut() {
    setTimeout(() => {
      this.shouldShowSearch = false;
    }, 300)

  }
}
