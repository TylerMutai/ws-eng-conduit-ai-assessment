import { DynamicFormComponent, Field, formsActions, ListErrorsComponent, ngrxFormsQuery } from '@realworld/core/forms';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { articleActions, articleEditActions, articleQuery } from '@realworld/articles/data-access';

const structure: Field[] = [
  {
    type: 'INPUT',
    name: 'title',
    label: 'Article Title',
    placeholder: 'Enter a cool & snappy title',
    validator: [Validators.required],
  },
  {
    type: 'INPUT',
    name: 'description',
    label: "What's this article about?",
    placeholder: "What's this article about?",
    validator: [Validators.required],
  },
  {
    type: 'TEXTAREA',
    name: 'body',
    label: 'Article',
    placeholder: 'Write your article',
    validator: [Validators.required],
  },
  {
    type: 'INPUT',
    name: 'tagList',
    label: 'Tags',
    placeholder: 'Add tags',
    validator: [],
  },
  {
    type: 'SELECT',
    name: 'co_authors',
    label: 'Co-authors',
    placeholder: 'Add co-authors',
    validator: [],
  },
];

@UntilDestroy()
@Component({
  selector: 'cdt-article-edit',
  standalone: true,
  templateUrl: './article-edit.component.html',
  styleUrls: ['./article-edit.component.css'],
  imports: [DynamicFormComponent, ListErrorsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleEditComponent implements OnInit, OnDestroy {
  structure$ = this.store.select(ngrxFormsQuery.selectStructure);
  data$ = this.store.select(ngrxFormsQuery.selectData);

  constructor(private readonly store: Store) {}

  ngOnInit() {
    this.store.dispatch(formsActions.setStructure({ structure }));
    this.store.dispatch(articleActions.loadAuthors());

    this.store
      .select(articleQuery.selectData)
      .pipe(untilDestroyed(this))
      .subscribe((article) => this.store.dispatch(formsActions.setData({ data: article })));

    this.store
      .select(articleQuery.selectAuthors)
      .pipe(untilDestroyed(this))
      .subscribe((authors) => {
        this.store.dispatch(articleActions.loadAuthorsSuccess({ authors }));
        this.store.dispatch(
          formsActions.setStructure({
            structure: structure.map((s) => ({
              ...s,
              selectValues: authors.map((a) => ({
                value: a.id,
                label: a.username,
              })),
            })),
          }),
        );
      });
  }

  updateForm(changes: any) {
    this.store.dispatch(formsActions.updateData({ data: changes }));
  }

  submit() {
    this.store.dispatch(articleEditActions.publishArticle());
  }

  ngOnDestroy() {
    this.store.dispatch(formsActions.initializeForm());
  }
}
