namespace JsStore {
    export namespace Business {
        export class InsertHelper extends Base {
            _valuesAffected = [];
            _query: IInsert;
            _table: Table;

            public onTransactionCompleted = function () {
                this._onSuccess(this._query.Return ? this._valuesAffected : this._rowAffected);
            };

            protected checkModifyInsertValues = function () {
                var value_index = 0,
                    value,
                    table_name = this._table._name,
                    checkDatas = function () {
                        value = this._query.Values[value_index++];
                        if (value) {
                            checkAndModifyValue();
                        }
                        else {
                            this.insertData();
                        }
                    }.bind(this);
                var checkAndModifyValue = function () {
                    var column_index = 0,
                        onValidationError = function (error: Error_Type, details: any) {
                            this._errorOccured = true;
                            this._error = new Error(error, details).get();
                        }.bind(this);
                    var checkAndModifyColumn = function (column: Column) {
                        if (this._errorOccured === true) {
                            this.onErrorOccured(this._error, true);
                        }
                        else {
                            var checkNotNullAndDataType = function () {
                                // check not null schema
                                if (column._notNull && isNull(value[column._name])) {
                                    onValidationError(Error_Type.NullValue, { ColumnName: column._name });
                                }
                                // check datatype
                                else if (column._dataType && typeof value[column._name] !== column._dataType) {
                                    onValidationError(Error_Type.BadDataType, { ColumnName: column._name });
                                }
                                checkAndModifyColumn(this._table._columns[column_index++]);
                            }.bind(this);
                            var saveAutoIncrementValue = function () {
                                var auto_increment_key =
                                    "JsStore_" + active_db._name + "_" + table_name + "_" + column._name + "_Value";
                                KeyStore.get(
                                    auto_increment_key,
                                    function (columnValue: number) {
                                        value[column._name] = ++columnValue;
                                        KeyStore.set(
                                            auto_increment_key,
                                            columnValue,
                                            checkNotNullAndDataType);
                                    }
                                );
                            };
                            if (column) {
                                // check auto increment scheme
                                if (column._autoIncrement) {
                                    saveAutoIncrementValue();
                                }
                                // check Default Schema
                                else if (column._default && isNull(value[column._name])) {
                                    value[column._name] = column._default;
                                    checkNotNullAndDataType();
                                }
                                else {
                                    checkNotNullAndDataType();
                                }
                            }
                            else {
                                checkDatas();
                            }
                        }
                    }.bind(this);
                    checkAndModifyColumn(this._table._columns[column_index++]);
                }.bind(this);
                checkDatas();
            };
        }
    }
}
