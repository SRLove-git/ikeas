# ADR-0001：数据层选型（PostgreSQL + MyBatis-Plus + Flyway）

- 状态：Accepted（2026-08-09）
- 背景：项目当前以 JSON 文件作为数据层，无法支撑企业级业务（事务、并发、审计、查询）。需要引入数据库与 ORM。
- 决策：
  - 数据库：PostgreSQL 16（事务、JSONB、生态成熟）。
  - ORM：MyBatis-Plus（团队熟悉度高、CRUD 封装完善、分页/逻辑删除/乐观锁开箱即用、复杂 SQL 用 Mapper XML 参数化书写）。
  - 迁移：Flyway（版本化迁移、与 Spring Boot 集成好）。
  - 并发控制：逻辑删除 `@TableLogic`、乐观锁 `@Version`、审计字段自动填充。
- 影响：
  - 表结构变更必须走 Flyway 迁移脚本，禁止手工改库。
  - 业务代码禁止拼字符串 SQL，统一 `LambdaQueryWrapper` 或 XML `#{}` 参数化。
  - JSON 数据层保留为过渡期只读/迁移来源，数据库落地后逐步下线。
