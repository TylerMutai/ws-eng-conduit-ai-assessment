import {Migration} from '@mikro-orm/migrations';

export class NNAddAuthorsPivotToArticles extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table `article_author` (`id` int unsigned not null auto_increment primary key, `article_id` int unsigned not null, `author_id` int unsigned not null) default character set utf8mb4 engine = InnoDB;',
    );
    this.addSql('alter table `article_author` add index `article_author_article_id_index`(`article_id`);');
    this.addSql('alter table `article_author` add index `article_author_author_id_index`(`author_id`);');

    this.addSql(
      'alter table `article_author` add constraint `article_author_article_id_foreign` foreign key (`article_id`) references `article` (`id`) on update cascade;',
    );
    this.addSql(
      'alter table `article_author` add constraint `article_author_tag_id_foreign` foreign key (`author_id`) references `user` (`id`) on update cascade;',
    );
  }
}
