import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1779690516092 implements MigrationInterface {
  name = 'Init1779690516092';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "conversation" ADD "lastMessageId" integer`);
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD "lastActivityAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "avatarUrl" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD "lastSeenAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" ADD "lastReadMessageId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" ADD "joinedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(`ALTER TABLE "message" ADD "replyToId" integer`);
    await queryRunner.query(`ALTER TABLE "message" ADD "metadata" jsonb DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "conversation" ALTER COLUMN "name" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`,
    );
    await queryRunner.query(`ALTER TABLE "message" ALTER COLUMN "senderId" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_de0389f98ed76b16b16a975542" ON "conversation" ("lastMessageId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38f662fb7650952e410d40cc74" ON "conversation" ("lastActivityAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60d2472bf74fd7de2c151d767b" ON "message" ("conversationId", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD CONSTRAINT "FK_de0389f98ed76b16b16a9755423" FOREIGN KEY ("lastMessageId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_dc84d76f927b87f616cbedcf2e5" FOREIGN KEY ("replyToId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_dc84d76f927b87f616cbedcf2e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP CONSTRAINT "FK_de0389f98ed76b16b16a9755423"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_60d2472bf74fd7de2c151d767b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_38f662fb7650952e410d40cc74"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_de0389f98ed76b16b16a975542"`);
    await queryRunner.query(`ALTER TABLE "message" ALTER COLUMN "senderId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "conversation" ALTER COLUMN "name" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "metadata"`);
    await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "replyToId"`);
    await queryRunner.query(`ALTER TABLE "conversation_participants" DROP COLUMN "joinedAt"`);
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" DROP COLUMN "lastReadMessageId"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "lastSeenAt"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarUrl"`);
    await queryRunner.query(`ALTER TABLE "conversation" DROP COLUMN "lastActivityAt"`);
    await queryRunner.query(`ALTER TABLE "conversation" DROP COLUMN "lastMessageId"`);
  }
}
