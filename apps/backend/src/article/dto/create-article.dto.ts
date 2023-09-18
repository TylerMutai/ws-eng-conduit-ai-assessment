export class CreateArticleDto {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: string[];
  readonly co_authors: number[];
}
