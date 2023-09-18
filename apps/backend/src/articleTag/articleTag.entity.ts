import { Entity, ManyToOne } from '@mikro-orm/core';
import { Tag } from '../tag/tag.entity';
import { Article } from '../article/article.entity';

@Entity()
export class ArticleTag {
  @ManyToOne(() => Article, { primary: true })
  article: Article;

  @ManyToOne(() => Tag, { primary: true })
  tag: Tag;
}
