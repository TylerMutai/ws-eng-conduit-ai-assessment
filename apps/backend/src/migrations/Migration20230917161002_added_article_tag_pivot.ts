import { Migration } from '@mikro-orm/migrations';

export class Migration20230917161002_added_article_tag_pivot extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table `article_tag` (`id` int unsigned not null auto_increment primary key, `article_id` int unsigned not null, `tag_id` int unsigned not null) default character set utf8mb4 engine = InnoDB;',
    );
    this.addSql('alter table `article_tag` add index `article_tag_article_id_index`(`article_id`);');
    this.addSql('alter table `article_tag` add index `article_tag_tag_id_index`(`tag_id`);');

    this.addSql(
      'alter table `article_tag` add constraint `article_tag_article_id_foreign` foreign key (`article_id`) references `article` (`id`) on update cascade;',
    );
    this.addSql(
      'alter table `article_tag` add constraint `article_tag_tag_id_foreign` foreign key (`tag_id`) references `tag` (`id`) on update cascade;',
    );
  }
}
