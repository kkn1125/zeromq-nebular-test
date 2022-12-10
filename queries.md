CREATE TAG space (name STRING, volume FLOAT, owner STRING, max_users INT, max_boservers INT, max_managers INT)
CREATE TAG IF NOT EXISTS channel (name STRING)
CREATE TAG IF NOT EXISTS user (uuid STRING, email STRING)

CREATE EDGE IF NOT EXISTS attach (sequence INT, type STRING)
CREATE EDGE IF NOT EXISTS allocation (type STRING)

CREATE TAG IF NOT EXISTS pool_socket (url STRING, port INT, live_status BOOL, cpu_usage float, mem_usage float)
CREATE TAG IF NOT EXISTS pool_publish (url STRING, port INT, live_status BOOL)

<!-- indexing & rebuilding -->

CREATE TAG INDEX IF NOT EXISTS user_index ON user()
REBUILD TAG INDEX user_index

CREATE TAG INDEX IF NOT EXISTS channel_index ON channel()
REBUILD TAG INDEX channel_index

CREATE EDGE INDEX IF NOT EXISTS attach_index ON attach()
REBUILD EDGE INDEX attach_index

GO FROM "test" OVER attach YIELD id($$)
<!-- channel1을 allocation엣지에 연결된 버텍스를 조회하는데, start는 channels, middle은 allocation, end는 users, 그리고 channels 기준으로 그룹화 시킨다. -->
GO FROM "channel1" OVER allocation REVERSELY YIELD properties($^) as start, properties(edge) as middle, properties($$) as end limit [5] | GROUP BY $-.start YIELD collect($-.start) as starts, collect($-.middle) as middles, collect($-.end) as ends
<!-- 채널별 개수 산정 -->
MATCH (v:channels)<--(v2:users) RETURN DISTINCT id(v), count(v2) AS count, CASE WHEN count(v2) < 50 THEN count(v2) ELSE false end AS result

<!-- 전체 조회 -->

LOOKUP ON space WHERE space.name != "" YIELD PROPERTIES(VERTEX) AS space
LOOKUP ON user WHERE user.uuid != "" YIELD PROPERTIES(VERTEX) AS user
LOOKUP ON channel WHERE channel.name != "" YIELD PROPERTIES(VERTEX) AS channel
LOOKUP ON attach WHERE attach.type != "" YIELD PROPERTIES(EDGE) AS attach


<!-- 단일 조회 -->

LOOKUP ON user WHERE user.uuid == "some_value" YIELD PROPERTIES(VERTEX).uuid AS uuid
LOOKUP ON channel WHERE channel.name == "some_value" YIELD PROPERTIES(VERTEX).name AS name

<!-- insert -->

INSERT VERTEX user (uuid, email) VALUES "user1": ("uuid", "email")
