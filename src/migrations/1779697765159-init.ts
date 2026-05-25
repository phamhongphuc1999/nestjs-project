import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1779697765159 implements MigrationInterface {
  name = 'Init1779697765159';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "conversation" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "type" integer NOT NULL, "name" character varying, "hash" character varying NOT NULL, "lastMessageId" integer, "lastActivityAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_864528ec4274360a40f66c29845" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de0389f98ed76b16b16a975542" ON "conversation" ("lastMessageId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38f662fb7650952e410d40cc74" ON "conversation" ("lastActivityAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "password" character varying NOT NULL, "email" character varying NOT NULL, "avatarUrl" character varying, "status" integer NOT NULL DEFAULT '1', "role" integer NOT NULL DEFAULT '1', "lastSeenAt" TIMESTAMP WITH TIME ZONE, "refreshToken" character varying, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversation_participants" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "userId" integer NOT NULL, "conversationId" integer NOT NULL, "role" integer NOT NULL, "lastReadMessageId" integer, "joinedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_e43efbfa3b850160b5b2c50e3ec" UNIQUE ("userId", "conversationId"), CONSTRAINT "PK_61b51428ad9453f5921369fbe94" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18c4ba3b127461649e5f5039db" ON "conversation_participants" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4453e20858b14ab765a09ad728" ON "conversation_participants" ("conversationId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "message" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "conversationId" integer NOT NULL, "senderId" integer, "content" character varying NOT NULL, "type" integer NOT NULL DEFAULT '1', "replyToId" integer, "metadata" jsonb DEFAULT '{}', CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7cf4a4df1f2627f72bf6231635" ON "message" ("conversationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bc096b4e18b1f9508197cd9806" ON "message" ("senderId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60d2472bf74fd7de2c151d767b" ON "message" ("conversationId", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD CONSTRAINT "FK_de0389f98ed76b16b16a9755423" FOREIGN KEY ("lastMessageId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_18c4ba3b127461649e5f5039dbf" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_4453e20858b14ab765a09ad728c" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
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
      `ALTER TABLE "message" DROP CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_4453e20858b14ab765a09ad728c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_18c4ba3b127461649e5f5039dbf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP CONSTRAINT "FK_de0389f98ed76b16b16a9755423"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_60d2472bf74fd7de2c151d767b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bc096b4e18b1f9508197cd9806"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7cf4a4df1f2627f72bf6231635"`);
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4453e20858b14ab765a09ad728"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_18c4ba3b127461649e5f5039db"`);
    await queryRunner.query(`DROP TABLE "conversation_participants"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_38f662fb7650952e410d40cc74"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_de0389f98ed76b16b16a975542"`);
    await queryRunner.query(`DROP TABLE "conversation"`);
  }
}
