;

//! require 'table.js'

!function (ns) {
    'use strict';

    var Meta = ns.Meta;

    var Facebook = ns.Facebook;

    var Table = ns.db.Table;

    var save_metas = function (map) {
        return Table.save(map, MetaTable);
    };
    var load_metas = function () {
        var metas = {};
        var map = Table.load(MetaTable);
        if (map) {
            var facebook = Facebook.getInstance();
            var identifier, meta;
            var list = Object.keys(map);
            for (var i = 0; i < list.length; ++i) {
                identifier = list[i];
                meta = map[identifier];
                identifier = facebook.getIdentifier(identifier);
                meta = Meta.getInstance(meta);
                if (identifier && meta) {
                    metas[identifier] = meta;
                }
            }
        }
        return metas;
    };

    var MetaTable = function () {
        this.metas = null;
    };

    MetaTable.prototype.loadMeta = function (identifier) {
        if (!this.metas) {
            this.metas = load_metas();
        }
        return this.metas[identifier];
    };
    MetaTable.prototype.saveMeta = function (meta, identifier) {
        this.loadMeta(identifier);
        this.metas[identifier] = meta;
        console.log('saving meta for ' + identifier);
        return save_metas(this.metas);
    };

    //-------- namespace --------
    ns.db.MetaTable = MetaTable;

}(DIMP);
