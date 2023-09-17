import {Migration} from '@mikro-orm/migrations';

export class NDeleteTagListFieldFromArticles extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `article` drop column `tag_list`');
  }
}
