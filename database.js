"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var sqlite3_1 = require("sqlite3");
var fs_1 = require("fs");
var path_1 = require("path");
var DatabaseManager = /** @class */ (function () {
    function DatabaseManager() {
        this.dbPath = path_1.default.join(process.cwd(), 'amanda.db');
        this.db = new sqlite3_1.default.Database(this.dbPath);
        this.initializeTables();
        // Executa a migração após inicializar
        this.migrateDatabase().catch(function (error) {
            console.error('Erro ao executar migração:', error);
        });
    }
    DatabaseManager.getInstance = function () {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    };
    DatabaseManager.prototype.migrateDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Verifica se a coluna user_name existe
                        _this.db.get("PRAGMA table_info(user_groups)", function (err, rows) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            // Adiciona a coluna user_name se não existir
                            _this.db.run("\n                    ALTER TABLE user_groups \n                    ADD COLUMN user_name TEXT;\n                ", function (err) {
                                if (err && !err.message.includes('duplicate column name')) {
                                    reject(err);
                                    return;
                                }
                                resolve();
                            });
                        });
                    })];
            });
        });
    };
    DatabaseManager.prototype.initializeTables = function () {
        // Tabela de grupos
        this.db.run("\n            CREATE TABLE IF NOT EXISTS groups (\n                id TEXT PRIMARY KEY,\n                name TEXT,\n                member_count INTEGER DEFAULT 0,\n                admins TEXT,\n                total_messages INTEGER DEFAULT 0,\n                active BOOLEAN DEFAULT true,\n                game_active BOOLEAN DEFAULT false,\n                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n                last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n            )\n        ");
        // Nova tabela para usuários e seus grupos
        this.db.run("\n            CREATE TABLE IF NOT EXISTS user_groups (\n                user_id TEXT,\n                group_id TEXT,\n                group_name TEXT,\n                user_name TEXT,\n                name_captured TEXT,\n                phone_number TEXT,\n                total_messages INTEGER DEFAULT 0,\n                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n                last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n                is_admin BOOLEAN DEFAULT false,\n                PRIMARY KEY (user_id, group_id),\n                FOREIGN KEY (group_id) REFERENCES groups(id)\n            )\n        ");
        // Tabela de mensagens
        this.db.run("\n            CREATE TABLE IF NOT EXISTS messages (\n                id TEXT PRIMARY KEY,\n                user_id TEXT,\n                group_id TEXT,\n                group_name TEXT,\n                message TEXT,\n                type TEXT,\n                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n                FOREIGN KEY (user_id, group_id) REFERENCES user_groups(user_id, group_id)\n            )\n        ");
        // Tabela de configurações
        this.db.run("\n            CREATE TABLE IF NOT EXISTS settings (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                group_id TEXT UNIQUE,\n                welcome_message TEXT,\n                auto_response BOOLEAN DEFAULT true,\n                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n                FOREIGN KEY (group_id) REFERENCES groups(id)\n            )\n        ");
        // Tabela de economia
        this.db.run(`
            CREATE TABLE IF NOT EXISTS economy (
                group_id TEXT,
                user_id TEXT,
                coins INTEGER DEFAULT 0,
                last_daily TIMESTAMP,
                mining_chances INTEGER DEFAULT 3,
                steal_chances INTEGER DEFAULT 2,
                avenge_chances INTEGER DEFAULT 1,
                lend_chances INTEGER DEFAULT 2,
                donate_chances INTEGER DEFAULT 3,
                casino_chances INTEGER DEFAULT 5,
                shield BOOLEAN DEFAULT false,
                lucky_charm BOOLEAN DEFAULT false,
                PRIMARY KEY (group_id, user_id),
                FOREIGN KEY (group_id) REFERENCES groups(id)
            )
        `);
    };
    // Métodos para grupos
    DatabaseManager.prototype.addGroup = function (id_1, name_1) {
        return __awaiter(this, arguments, void 0, function (id, name, memberCount, admins) {
            var _this = this;
            if (memberCount === void 0) { memberCount = 0; }
            if (admins === void 0) { admins = []; }
            return __generator(this, function (_a) {
                console.log('Criando novo grupo:', { id, name, memberCount, admins });
                return [2 /*return*/, new Promise(function (resolve, reject) {
                    _this.db.run(`
                        INSERT OR REPLACE INTO groups (
                            id, 
                            name, 
                            member_count, 
                            admins, 
                            total_messages,
                            active,
                            game_active,
                            created_at,
                            last_interaction
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, 
                        [id, name, memberCount, JSON.stringify(admins), 0, true, false], 
                        function (err) {
                            if (err) {
                                console.error('Erro ao criar grupo:', err);
                                reject(err);
                            } else {
                                console.log('Grupo criado com sucesso');
                                resolve();
                            }
                        });
                })];
            });
        });
    };
    DatabaseManager.prototype.updateGroupInfo = function (id, memberCount, admins) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.run('UPDATE groups SET member_count = ?, admins = ?, last_interaction = CURRENT_TIMESTAMP WHERE id = ?', [memberCount, JSON.stringify(admins), id], function (err) {
                            if (err)
                                reject(err);
                            else
                                resolve();
                        });
                    })];
            });
        });
    };
    // Métodos para mensagens
    DatabaseManager.prototype.addMessage = function (messageId, userId, groupId, groupName, message, type) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.run('INSERT INTO messages (id, user_id, group_id, group_name, message, type, timestamp) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)', [messageId, userId, groupId, groupName, message, type], function (err) { return __awaiter(_this, void 0, void 0, function () {
                            var error_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (err) {
                                            reject(err);
                                            return [2 /*return*/];
                                        }
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 4, , 5]);
                                        if (!groupId) return [3 /*break*/, 3];
                                        return [4 /*yield*/, this.updateMessageCounters(userId, groupId)];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3:
                                        resolve();
                                        return [3 /*break*/, 5];
                                    case 4:
                                        error_1 = _a.sent();
                                        reject(error_1);
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); });
                    })];
            });
        });
    };
    // Métodos para configurações
    DatabaseManager.prototype.getGroupSettings = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.get('SELECT * FROM settings WHERE group_id = ?', [groupId], function (err, row) {
                            if (err)
                                reject(err);
                            else
                                resolve(row);
                        });
                    })];
            });
        });
    };
    DatabaseManager.prototype.updateGroupSettings = function (groupId, settings) {
        return __awaiter(this, void 0, void 0, function () {
            var welcome_message, auto_response;
            var _this = this;
            return __generator(this, function (_a) {
                welcome_message = settings.welcome_message, auto_response = settings.auto_response;
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.run("INSERT INTO settings (group_id, welcome_message, auto_response, updated_at)\n                 VALUES (?, ?, ?, CURRENT_TIMESTAMP)\n                 ON CONFLICT(group_id) DO UPDATE SET\n                 welcome_message = ?,\n                 auto_response = ?,\n                 updated_at = CURRENT_TIMESTAMP", [groupId, welcome_message, auto_response, welcome_message, auto_response], function (err) {
                            if (err)
                                reject(err);
                            else
                                resolve();
                        });
                    })];
            });
        });
    };
    // Métodos de estatísticas
    DatabaseManager.prototype.getGroupStats = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.get("SELECT \n                    g.name,\n                    g.total_messages,\n                    g.created_at,\n                    g.last_interaction,\n                    COUNT(DISTINCT m.user_id) as unique_users,\n                    (SELECT COUNT(*) FROM messages WHERE group_id = ? AND created_at >= datetime('now', '-24 hours')) as messages_last_24h\n                FROM groups g\n                LEFT JOIN messages m ON g.id = m.group_id\n                WHERE g.id = ?\n                GROUP BY g.id", [groupId, groupId], function (err, row) {
                            if (err)
                                reject(err);
                            else
                                resolve(row);
                        });
                    })];
            });
        });
    };
    DatabaseManager.prototype.getUserStats = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.get("\n                SELECT \n                    user_name as name,\n                    SUM(total_messages) as total_messages,\n                    MAX(joined_at) as first_seen,\n                    MAX(last_interaction) as last_interaction,\n                    COUNT(DISTINCT group_id) as groups_active,\n                    (\n                        SELECT COUNT(*) \n                        FROM messages \n                        WHERE user_id = ? \n                        AND created_at >= datetime('now', '-24 hours')\n                    ) as messages_last_24h\n                FROM user_groups\n                WHERE user_id = ?\n                GROUP BY user_id, user_name\n            ", [userId, userId], function (err, row) {
                            if (err)
                                reject(err);
                            else
                                resolve(row);
                        });
                    })];
            });
        });
    };
    // Novos métodos de consulta
    DatabaseManager.prototype.getGroupMembers = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.all('SELECT * FROM users WHERE group_id = ?', [groupId], function (err, rows) {
                            if (err)
                                reject(err);
                            else
                                resolve(rows);
                        });
                    })];
            });
        });
    };
    DatabaseManager.prototype.getGroupAdmins = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.get('SELECT admins FROM groups WHERE id = ?', [groupId], function (err, row) {
                            if (err)
                                reject(err);
                            else
                                resolve(row ? JSON.parse(row.admins) : []);
                        });
                    })];
            });
        });
    };
    DatabaseManager.prototype.getUserGroups = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.all("\n                SELECT \n                    g.id as group_id,\n                    g.name as group_name,\n                    ug.joined_at,\n                    ug.is_admin\n                FROM user_groups ug\n                JOIN groups g ON ug.group_id = g.id\n                WHERE ug.user_id = ?\n                ORDER BY ug.joined_at DESC\n            ", [userId], function (err, rows) {
                            if (err)
                                reject(err);
                            else
                                resolve(rows);
                        });
                    })];
            });
        });
    };
    // Função para resetar o banco de dados
    DatabaseManager.prototype.resetDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Fecha a conexão com o banco
                        _this.db.close(function (err) {
                            if (err) {
                                console.error('Erro ao fechar conexão:', err);
                                reject(err);
                                return;
                            }
                            try {
                                // Deleta o arquivo do banco
                                if (fs_1.default.existsSync(_this.dbPath)) {
                                    fs_1.default.unlinkSync(_this.dbPath);
                                    console.log('Banco de dados deletado com sucesso');
                                }
                                // Recria a conexão
                                _this.db = new sqlite3_1.default.Database(_this.dbPath);
                                // Reinicializa as tabelas
                                _this.initializeTables();
                                console.log('Banco de dados reinicializado com sucesso');
                                resolve();
                            }
                            catch (error) {
                                console.error('Erro ao resetar banco:', error);
                                reject(error);
                            }
                        });
                    })];
            });
        });
    };
    // Método para adicionar usuário em um grupo
    DatabaseManager.prototype.addUserToGroup = function (userId_1, userName_1, phoneNumber_1, groupId_1, groupName_1) {
        return __awaiter(this, arguments, void 0, function (userId, userName, phoneNumber, groupId, groupName, nameCaptured, isAdmin) {
            var _this = this;
            if (nameCaptured === void 0) { nameCaptured = null; }
            if (isAdmin === void 0) { isAdmin = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.run("INSERT OR REPLACE INTO user_groups (\n                    user_id, \n                    user_name, \n                    phone_number, \n                    group_id, \n                    group_name, \n                    name_captured,\n                    is_admin,\n                    last_interaction\n                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)", [userId, userName, phoneNumber, groupId, groupName, nameCaptured || userName, isAdmin], function (err) {
                            if (err)
                                reject(err);
                            else
                                resolve();
                        });
                    })];
            });
        });
    };
    // Método para atualizar nome capturado do usuário
    DatabaseManager.prototype.updateUserCapturedName = function (userId, groupId, nameCaptured) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.run('UPDATE user_groups SET name_captured = ?, last_interaction = CURRENT_TIMESTAMP WHERE user_id = ? AND group_id = ?', [nameCaptured, userId, groupId], function (err) {
                            if (err)
                                reject(err);
                            else
                                resolve();
                        });
                    })];
            });
        });
    };
    // Método para listar todos os usuários e seus grupos
    DatabaseManager.prototype.listAllUsersAndGroups = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.all("\n                SELECT \n                    user_id as id,\n                    user_name,\n                    name_captured,\n                    phone_number,\n                    GROUP_CONCAT(DISTINCT group_name) as groups,\n                    COUNT(DISTINCT group_id) as group_count,\n                    SUM(total_messages) as total_messages,\n                    MAX(last_interaction) as last_interaction\n                FROM user_groups\n                GROUP BY user_id, user_name, phone_number\n                ORDER BY user_name\n            ", [], function (err, rows) {
                            if (err)
                                reject(err);
                            else
                                resolve(rows);
                        });
                    })];
            });
        });
    };
    // Método para buscar usuários de um grupo específico
    DatabaseManager.prototype.getGroupUsers = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.all("\n                SELECT \n                    user_id as id,\n                    user_name,\n                    name_captured,\n                    phone_number,\n                    joined_at,\n                    last_interaction,\n                    total_messages,\n                    is_admin\n                FROM user_groups\n                WHERE group_id = ?\n                ORDER BY user_name\n            ", [groupId], function (err, rows) {
                            if (err)
                                reject(err);
                            else
                                resolve(rows);
                        });
                    })];
            });
        });
    };
    // Método para atualizar status do grupo
    DatabaseManager.prototype.updateGroupStatus = function (groupId, isActive) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.run('UPDATE groups SET active = ?, last_interaction = CURRENT_TIMESTAMP WHERE id = ?', [isActive, groupId], function (err) {
                            if (err)
                                reject(err);
                            else
                                resolve();
                        });
                    })];
            });
        });
    };
    // Método para listar grupos ativos
    DatabaseManager.prototype.listActiveGroups = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.all("\n                SELECT \n                    g.id,\n                    g.name,\n                    g.member_count,\n                    g.last_interaction,\n                    COUNT(DISTINCT ug.user_id) as total_users\n                FROM groups g\n                LEFT JOIN user_groups ug ON g.id = ug.group_id\n                WHERE g.active = true\n                GROUP BY g.id\n                ORDER BY g.last_interaction DESC\n            ", [], function (err, rows) {
                            if (err)
                                reject(err);
                            else
                                resolve(rows);
                        });
                    })];
            });
        });
    };
    // Método para listar grupos inativos
    DatabaseManager.prototype.listInactiveGroups = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.all("\n                SELECT \n                    g.id,\n                    g.name,\n                    g.member_count,\n                    g.last_interaction,\n                    COUNT(DISTINCT ug.user_id) as total_users\n                FROM groups g\n                LEFT JOIN user_groups ug ON g.id = ug.group_id\n                WHERE g.active = false\n                GROUP BY g.id\n                ORDER BY g.last_interaction DESC\n            ", [], function (err, rows) {
                            if (err)
                                reject(err);
                            else
                                resolve(rows);
                        });
                    })];
            });
        });
    };
    // Método para verificar se uma mensagem existe
    DatabaseManager.prototype.messageExists = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.get('SELECT COUNT(*) as count FROM messages WHERE id = ?', [messageId], function (err, row) {
                            if (err)
                                reject(err);
                            else
                                resolve(row.count > 0);
                        });
                    })];
            });
        });
    };
    // Método para recuperar mensagens de um grupo
    DatabaseManager.prototype.getGroupMessages = function (groupId_1) {
        return __awaiter(this, arguments, void 0, function (groupId, limit) {
            var _this = this;
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.all("SELECT m.*, u.name as user_name\n                FROM messages m\n                LEFT JOIN users u ON m.user_id = u.id\n                WHERE m.group_id = ?\n                ORDER BY m.timestamp DESC\n                LIMIT ?", [groupId, limit], function (err, rows) {
                            if (err)
                                reject(err);
                            else
                                resolve(rows);
                        });
                    })];
            });
        });
    };
    // Método para contar mensagens por período
    DatabaseManager.prototype.countMessages = function () {
        return __awaiter(this, arguments, void 0, function (groupId, period) {
            var _this = this;
            if (groupId === void 0) { groupId = null; }
            if (period === void 0) { period = '24 hours'; }
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var query = groupId
                            ? "SELECT COUNT(*) as count \n                   FROM messages \n                   WHERE group_id = ? \n                   AND timestamp >= datetime('now', '-".concat(period, "')")
                            : "SELECT COUNT(*) as count \n                   FROM messages \n                   WHERE timestamp >= datetime('now', '-".concat(period, "')");
                        var params = groupId ? [groupId] : [];
                        _this.db.get(query, params, function (err, row) {
                            if (err)
                                reject(err);
                            else
                                resolve(row.count);
                        });
                    })];
            });
        });
    };
    // Método para atualizar contadores de mensagens
    DatabaseManager.prototype.updateMessageCounters = function (userId, groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Atualiza contador do usuário no grupo
                        _this.db.run('UPDATE user_groups SET total_messages = total_messages + 1, last_interaction = CURRENT_TIMESTAMP WHERE user_id = ? AND group_id = ?', [userId, groupId], function (err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            // Atualiza contador do grupo
                            _this.db.run('UPDATE groups SET total_messages = total_messages + 1, last_interaction = CURRENT_TIMESTAMP WHERE id = ?', [groupId], function (err) {
                                if (err)
                                    reject(err);
                                else
                                    resolve();
                            });
                        });
                    })];
            });
        });
    };
    // Adicione a interface para economia
    DatabaseManager.prototype.getUserEconomy = function (groupId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.db.get('SELECT * FROM economy WHERE group_id = ? AND user_id = ?', [groupId, userId], function (err, row) {
                            if (err)
                                reject(err);
                            else
                                resolve(row);
                        });
                    })];
            });
        });
    };
    DatabaseManager.prototype.updateUserEconomy = function (groupId, userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var updates = [];
                        var values = [];
                        for (var key in data) {
                            updates.push(key + ' = ?');
                            values.push(data[key]);
                        }
                        values.push(groupId, userId);
                        _this.db.run('UPDATE economy SET ' + updates.join(', ') + ' WHERE group_id = ? AND user_id = ?', values, function (err) {
                            if (err)
                                reject(err);
                            else
                                resolve();
                        });
                    })];
            });
        });
    };
    DatabaseManager.prototype.createUserEconomy = function (groupId, userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var columns = ['group_id', 'user_id'];
                        var values = [groupId, userId];
                        var placeholders = ['?', '?'];
                        for (var key in data) {
                            columns.push(key);
                            values.push(data[key]);
                            placeholders.push('?');
                        }
                        _this.db.run('INSERT INTO economy (' + columns.join(', ') + ') VALUES (' + placeholders.join(', ') + ')', values, function (err) {
                            if (err)
                                reject(err);
                            else
                                resolve();
                        });
                    })];
            });
        });
    };
    DatabaseManager.prototype.getGroupEconomyRanking = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                    _this.db.all(`
                        SELECT 
                            e.*,
                            ug.user_id,
                            ug.user_name,
                            ug.name_captured
                        FROM economy e
                        JOIN user_groups ug ON e.user_id = ug.user_id AND e.group_id = ug.group_id
                        WHERE e.group_id = ?
                        AND e.coins > 0
                        ORDER BY e.coins DESC
                        LIMIT 10
                    `, [groupId], function (err, rows) {
                        if (err)
                            reject(err);
                        else
                            resolve(rows);
                    });
                })];
            });
        });
    };
    DatabaseManager.prototype.setGameActive = function (groupId, isActive) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                console.log('Alterando status do jogo:', { groupId, isActive });
                return [2 /*return*/, new Promise(function (resolve, reject) {
                    _this.db.run('UPDATE groups SET game_active = ?, last_interaction = CURRENT_TIMESTAMP WHERE id = ?', [isActive, groupId], function (err) {
                        if (err) {
                            console.error('Erro ao alterar status do jogo:', err);
                            reject(err);
                        } else {
                            console.log('Status do jogo alterado com sucesso:', { groupId, isActive });
                            resolve();
                        }
                    });
                })];
            });
        });
    };
    DatabaseManager.prototype.isGameActive = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                console.log('Verificando status do jogo para o grupo:', groupId);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                    _this.db.get('SELECT game_active FROM groups WHERE id = ?', [groupId], function (err, row) {
                        if (err) {
                            console.error('Erro ao verificar status do jogo:', err);
                            reject(err);
                        } else {
                            console.log('Status do jogo:', { groupId, status: row ? row.game_active : false });
                            if (!row) {
                                // Se o grupo não existe, cria um novo
                                _this.addGroup(groupId, 'Grupo CbCoin', 0, [])
                                    .then(() => resolve(false))
                                    .catch((err) => {
                                        console.error('Erro ao criar novo grupo:', err);
                                        reject(err);
                                    });
                            } else {
                                resolve(row.game_active);
                            }
                        }
                    });
                })];
            });
        });
    };
    DatabaseManager.prototype.getGroup = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                console.log('Buscando grupo:', groupId);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                    _this.db.get('SELECT id, name, member_count, admins, total_messages, active, game_active, created_at, last_interaction FROM groups WHERE id = ?', [groupId], function (err, row) {
                        if (err) {
                            console.error('Erro ao buscar grupo:', err);
                            reject(err);
                        } else {
                            console.log('Dados do grupo encontrados:', row);
                            if (row && row.admins) {
                                try {
                                    row.admins = JSON.parse(row.admins);
                                } catch (e) {
                                    console.error('Erro ao fazer parse dos admins:', e);
                                    row.admins = [];
                                }
                            } else {
                                row = {
                                    id: groupId,
                                    name: 'Grupo CbCoin',
                                    member_count: 0,
                                    admins: [],
                                    total_messages: 0,
                                    active: true,
                                    game_active: false,
                                    created_at: new Date(),
                                    last_interaction: new Date()
                                };
                            }
                            resolve(row);
                        }
                    });
                })];
            });
        });
    };
    return DatabaseManager;
}());
const db = DatabaseManager.getInstance();
module.exports = db;
