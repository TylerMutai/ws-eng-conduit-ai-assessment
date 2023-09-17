import {Collection, Entity, ManyToMany, PrimaryKey, Property} from '@mikro-orm/core';
import {Article} from "../article/article.entity";

@Entity()
export class Tag {
  @PrimaryKey({type: 'number'})
  id: number;

  @Property()
  tag: string;

  @ManyToMany(() => Article, o => o.tagList)
  articles = new Collection<Article>(this);
}
