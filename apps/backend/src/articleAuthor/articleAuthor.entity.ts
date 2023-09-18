import { Entity, ManyToOne } from '@mikro-orm/core';
import { Article } from '../article/article.entity';
import { User } from '../user/user.entity';

@Entity()
export class ArticleAuthor {
  @ManyToOne(() => Article, { primary: true })
  article: Article;

  @ManyToOne(() => User, { primary: true })
  author: User;
}
