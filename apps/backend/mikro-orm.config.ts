import { LoadStrategy } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/mysql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Migrator } from '@mikro-orm/migrations';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { SeedManager } from '@mikro-orm/seeder';
import { join } from 'path';
import { User } from './src/user/user.entity';
import { Tag } from './src/tag/tag.entity';
import { Article } from './src/article/article.entity';
import { Comment } from './src/article/comment.entity';
import { InitialMigration } from './src/migrations/InitialMigration';
import { ArticleTag } from './src/articleTag/articleTag.entity';
import { Migration20230917161002_added_article_tag_pivot } from './src/migrations/Migration20230917161002_added_article_tag_pivot';
import { NDeleteTagListFieldFromArticles } from './src/migrations/NDeleteTagListFieldFromArticles';

export default defineConfig({
  host: '127.0.0.1',
  port: 3306,
  user: 'phpmyadmin',
  password: 'phpmyadmin',
  dbName: 'conduit',
  migrations: {
    migrationsList: [
      {
        name: 'InitialMigration',
        class: InitialMigration,
      },
      {
        name: 'Migration20230917161002_added_article_tag_pivot',
        class: Migration20230917161002_added_article_tag_pivot,
      },
      {
        name: 'NDeleteTagListFieldFromArticles',
        class: NDeleteTagListFieldFromArticles,
      },
    ],
  },
  entities: [User, Tag, Article, ArticleTag, Comment],
  discovery: { disableDynamicFileAccess: true },
  seeder: {
    pathTs: join(__dirname, 'src', 'seeders'),
  },
  debug: true,
  loadStrategy: LoadStrategy.JOINED,
  highlighter: new SqlHighlighter(),
  metadataProvider: TsMorphMetadataProvider,
  // @ts-expect-error nestjs adapter option
  registerRequestContext: false,
  extensions: [Migrator, EntityGenerator, SeedManager],
});
