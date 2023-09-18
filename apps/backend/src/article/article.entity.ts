import {
  Collection,
  Entity,
  EntityDTO,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  wrap,
} from '@mikro-orm/core';
import slug from 'slug';

import {User} from '../user/user.entity';
import {Comment} from './comment.entity';
import {ArticleTag} from '../articleTag/articleTag.entity';
import {Tag} from '../tag/tag.entity';
import {ArticleAuthor} from "../articleAuthor/articleAuthor.entity";

@Entity()
export class Article {
  @PrimaryKey({type: 'number'})
  id: number;

  @Property()
  slug: string;

  @Property()
  title: string;

  @Property()
  description = '';

  @Property()
  body = '';

  @Property({type: 'date'})
  createdAt = new Date();

  @Property({type: 'date', onUpdate: () => new Date()})
  updatedAt = new Date();

  @ManyToMany({entity: () => Tag, pivotEntity: () => ArticleTag})
  tagList = new Collection<Tag>(this);

  @ManyToOne(() => User)
  author: User;

  @ManyToMany({entity: () => User, pivotEntity: () => ArticleAuthor})
  co_authors = new Collection<User>(this);

  @OneToMany(() => Comment, (comment) => comment.article, {eager: true, orphanRemoval: true})
  comments = new Collection<Comment>(this);

  @Property({type: 'number'})
  favoritesCount = 0;

  constructor(author: User, title: string, description: string, body: string) {
    this.author = author;
    this.title = title;
    this.description = description;
    this.body = body;
    this.slug = slug(title, {lower: true}) + '-' + ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
  }

  toJSON(user?: User) {
    const o = wrap<Article>(this).toObject() as ArticleDTO;
    o.favorited = user && user.favorites.isInitialized() ? user.favorites.contains(this) : false;
    o.author = this.author.toJSON(user);
    o.tags = this.tagList?.toJSON()?.map((t) => t.tag);
    return o;
  }
}

export interface ArticleDTO extends EntityDTO<Article> {
  favorited?: boolean;
  tags: string[];
}
