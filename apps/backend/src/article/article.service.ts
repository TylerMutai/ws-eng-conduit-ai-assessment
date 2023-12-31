import { Injectable } from '@nestjs/common';
import { EntityManager, QueryOrder, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/mysql';

import { User } from '../user/user.entity';
import { Article } from './article.entity';
import { IArticleRO, IArticlesRO, ICommentsRO } from './article.interface';
import { Comment } from './comment.entity';
import { CreateArticleDto, CreateCommentDto } from './dto';
import { Tag } from '../tag/tag.entity';
import { IArticleTagRO } from '../articleTag/articleTag.interface';
import { ArticleTag } from '../articleTag/articleTag.entity';
import { ArticleAuthor } from '../articleAuthor/articleAuthor.entity';

@Injectable()
export class ArticleService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Article)
    private readonly articleRepository: EntityRepository<Article>,
    @InjectRepository(Comment)
    private readonly commentRepository: EntityRepository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(Tag)
    private readonly tagRepository: EntityRepository<Tag>,
  ) {}

  async findAll(userId: number, query: Record<string, string>): Promise<IArticlesRO> {
    const user = userId
      ? await this.userRepository.findOne(userId, { populate: ['followers', 'favorites'] })
      : undefined;
    const qb = this.articleRepository
      .createQueryBuilder('a')
      .select('a.*')
      .leftJoin('a.author', 'u')
      .leftJoin('a.co_authors', 'co')
      .leftJoinAndSelect('a.tagList', 'at');

    if ('tag' in query) {
      qb.where({
        'at.tag': {
          $like: query.tag?.toLowerCase(),
        },
      });
    }

    if ('author' in query) {
      const author = await this.userRepository.findOne({ username: query.author });

      if (!author) {
        return { articles: [], articlesCount: 0 };
      }

      qb.andWhere({ author: author.id });
    }

    if ('favorited' in query) {
      const author = await this.userRepository.findOne({ username: query.favorited }, { populate: ['favorites'] });

      if (!author) {
        return { articles: [], articlesCount: 0 };
      }

      const ids = author.favorites.$.getIdentifiers();
      qb.andWhere({ author: ids });
    }

    qb.orderBy({ createdAt: QueryOrder.DESC });
    const res = await qb.clone().count('id', true).execute('get');
    const articlesCount = res.count;

    if ('limit' in query) {
      qb.limit(+query.limit);
    }

    if ('offset' in query) {
      qb.offset(+query.offset);
    }

    const articles = await qb.getResult();

    return { articles: articles.map((a) => a.toJSON(user!)), articlesCount };
  }

  async findFeed(userId: number, query: Record<string, string>): Promise<IArticlesRO> {
    const user = userId
      ? await this.userRepository.findOne(userId, { populate: ['followers', 'favorites'] })
      : undefined;
    const res = await this.articleRepository.findAndCount(
      { author: { followers: userId } },
      {
        populate: ['author'],
        orderBy: { createdAt: QueryOrder.DESC },
        limit: +query.limit,
        offset: +query.offset,
      },
    );

    return { articles: res[0].map((a) => a.toJSON(user!)), articlesCount: res[1] };
  }

  async findOne(userId: number, where: Partial<Article>): Promise<IArticleRO> {
    const user = userId
      ? await this.userRepository.findOneOrFail(userId, { populate: ['followers', 'favorites'] })
      : undefined;
    const article = await this.articleRepository.findOne(where, { populate: ['author'] });
    return { article: article && article.toJSON(user) } as IArticleRO;
  }

  async addComment(userId: number, slug: string, dto: CreateCommentDto) {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['author'] });
    const author = await this.userRepository.findOneOrFail(userId);
    const comment = new Comment(author, article, dto.body);
    await this.em.persistAndFlush(comment);

    return { comment, article: article.toJSON(author) };
  }

  async deleteComment(userId: number, slug: string, id: number): Promise<IArticleRO> {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['author'] });
    const user = await this.userRepository.findOneOrFail(userId);
    const comment = this.commentRepository.getReference(id);

    if (article.comments.contains(comment)) {
      article.comments.remove(comment);
      await this.em.removeAndFlush(comment);
    }

    return { article: article.toJSON(user) };
  }

  async favorite(id: number, slug: string): Promise<IArticleRO> {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['author'] });
    const user = await this.userRepository.findOneOrFail(id, { populate: ['favorites', 'followers'] });

    if (!user.favorites.contains(article)) {
      user.favorites.add(article);
      article.favoritesCount++;
    }

    await this.em.flush();
    return { article: article.toJSON(user) };
  }

  async unFavorite(id: number, slug: string): Promise<IArticleRO> {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['author'] });
    const user = await this.userRepository.findOneOrFail(id, { populate: ['followers', 'favorites'] });

    if (user.favorites.contains(article)) {
      user.favorites.remove(article);
      article.favoritesCount--;
    }

    await this.em.flush();
    return { article: article.toJSON(user) };
  }

  async findComments(slug: string): Promise<ICommentsRO> {
    const article = await this.articleRepository.findOne({ slug }, { populate: ['comments'] });
    return { comments: article!.comments.getItems() };
  }

  async create(userId: number, dto: CreateArticleDto) {
    const user = await this.userRepository.findOne(
      { id: userId },
      { populate: ['followers', 'favorites', 'articles'] },
    );
    const article = new Article(user!, dto.title, dto.description, dto.body);
    user?.articles.add(article);
    await this.em.flush();
    await this.addArticleTagsToTransaction(
      this.tagsToArticleTags(await this.generateMissingTagsFromString(dto.tagList), article),
    );
    await this.addCoAuthorsToTransaction(article, dto.co_authors, userId);
    return { article: article.toJSON(user!) };
  }

  async update(userId: number, slug: string, articleData: any): Promise<IArticleRO> {
    const user = await this.userRepository.findOne(
      { id: userId },
      { populate: ['followers', 'favorites', 'articles'] },
    );
    const article = await this.articleRepository.findOne({ slug }, { populate: ['author'] });
    delete articleData.createdAt;
    if (article) {
      await this.addArticleTagsToTransaction(
        this.tagsToArticleTags(await this.generateMissingTagsFromString(articleData.tagList), article),
      );
      delete articleData.tagList;
    }
    wrap(article).assign(articleData);
    await this.em.flush();

    return { article: article!.toJSON(user!) };
  }

  async delete(slug: string) {
    return this.articleRepository.nativeDelete({ slug });
  }

  private async addCoAuthorsToTransaction(article: Article, authorIds: number[], loggedInUserId: number) {
    const coAuthorIds = new Set<number>();
    for (const ad of authorIds) {
      if (!isNaN(ad)) {
        coAuthorIds.add(ad);
      }
    }
    coAuthorIds.delete(loggedInUserId);
    const users = await this.userRepository.find({
      id: {
        $in: Array.from(coAuthorIds.values()),
      },
    });
    for (const u of users) {
      this.em.persist(Object.assign(new ArticleAuthor(), { article: article.id, author: u.id }));
    }
    await this.em.flush();
  }

  private async addArticleTagsToTransaction(articles: IArticleTagRO[]) {
    for (const t of articles) {
      this.em.persist(Object.assign(new ArticleTag(), { article: t.articleId, tag: t.tagId }));
    }
    await this.em.flush();
  }

  private tagsToArticleTags(tags: Tag[], article: Article): IArticleTagRO[] {
    const articleTags: IArticleTagRO[] = [];
    for (const t of tags) {
      articleTags.push({
        articleId: article.id,
        tagId: t.id,
      });
    }
    return articleTags;
  }

  private async generateMissingTagsFromString(tags: string | Array<string>): Promise<Tag[]> {
    let newTags: string[];
    const delimiter = ',';
    if (typeof tags === 'string') {
      // split tags using [delimiter]
      newTags = tags.split(delimiter);
    } else {
      newTags = [...tags];
    }

    const cleanedTags = this.cleanTags(newTags);
    const tagsList = await this.tagRepository.findAll();
    const nameToIdMapping = new Map<string, number>();
    for (const tag of tagsList) {
      nameToIdMapping.set(this.getCleanedTagName(tag.tag), tag.id);
    }

    const newTagEntities: Tag[] = [];
    for (const cleanedTag of cleanedTags) {
      const t = new Tag();
      const id = nameToIdMapping.get(cleanedTag);
      if (id) {
        t.id = id;
      }
      if (cleanedTag) {
        t.tag = cleanedTag;
      }
      if (!id && cleanedTag) {
        this.em.persist(t);
      }
      newTagEntities.push(t);
    }
    await this.em.flush();
    return newTagEntities;
  }

  private cleanTags(tags: Array<string>): Array<string> {
    const newTags = [];
    for (const tag of tags) {
      const cleanTag = this.getCleanedTagName(tag);
      if (cleanTag) {
        newTags.push(cleanTag);
      }
    }
    return newTags;
  }

  private getCleanedTagName(tagName: string) {
    return tagName.trim().toLowerCase();
  }
}
