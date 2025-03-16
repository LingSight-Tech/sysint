CREATE TABLE config (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  service VARCHAR(255) NOT NULL DEFAULT 'invalid' COMMENT '服务名',
  `key` VARCHAR(255) NOT NULL DEFAULT 'invalid' COMMENT '配置 key',
  `value` TEXT NOT NULL COMMENT '配置值',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (id),
  UNIQUE KEY (`service`, `key`),
  INDEX idx_service (`service`) -- 在 service 上添加索引

) DEFAULT CHARSET=utf8mb4 COMMENT='配置中心';

CREATE TABLE user (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  open_id VARCHAR(255) NOT NULL COMMENT 'OpenID，用户唯一标识',
  union_id VARCHAR(255) NOT NULL COMMENT 'UnionID，多个应用下的唯一标识',
  session_key VARCHAR(255) NOT NULL COMMENT '会话密钥',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (id),
  UNIQUE KEY idx_open_id (open_id),
  UNIQUE KEY idx_union_id (union_id),
  INDEX idx_session_key (session_key) -- 在 session_key 上加索引，提高查询效率
) DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE conversation (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  uuid VARCHAR(36) NOT NULL COMMENT '会话 UUID',
  user_id BIGINT NOT NULL COMMENT '用户 ID',
  history_json JSON NOT NULL COMMENT '会话历史（JSON 格式）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (id),
  UNIQUE KEY idx_uuid (uuid),  -- 确保 UUID 唯一
  INDEX idx_user_id (user_id)  -- 加速按 user_id 查询
) DEFAULT CHARSET=utf8mb4 COMMENT='用户会话表';
