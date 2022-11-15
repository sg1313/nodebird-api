const Sequelize = require('sequelize');

module.exports = class Domain extends Sequelize.Model {
    static init(sequelize) {  // 이거쓰지말고 fs.snyc 어쩌구 그 방식으로 쓰기
        return super.init({
            host: {
                type: Sequelize.STRING(80),
                allowNull: false,
            },
            type: {
                type: Sequelize.ENUM('free', 'premium'), // 열거(콤보박스)
                allowNull: false,
            },
            clientSecret: {
                type: Sequelize.STRING(36),
                allowNull: false,
            },
        }, {
            sequelize,
            timestamps: true,
            paranoid: true,
            modelName: 'Domain',
            tableName: 'domains',
        });
    }

    static associate(db) {
        db.Domain.belongsTo(db.User);
    }
};