import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1773848920551 implements MigrationInterface {
  name = 'Init1773848920551';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT '1'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" DROP DEFAULT`);
  }
}
