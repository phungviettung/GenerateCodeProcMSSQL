const sql = require('mssql')
const fs = require('fs')

function CreateProc(table, option) {
    let { paramsSql, intoSql, columns } = option
    let tableNameInProc = table[0].toUpperCase() + table.slice(1)

    //create proc
    let stringParamSql = paramsSql.toString()
    let stringcolumns = columns.toString()
    let stringintoSql = intoSql.toString()

    let createProc = `CREATE PROCEDURE proc_Create${tableNameInProc} 
    ${stringParamSql}
AS
BEGIN 
INSERT INTO ${table}
    ( 
        ${stringcolumns}
    )
VALUES (
        ${stringintoSql}
    );
END;
GO

`
    //edit proc
    let stringParamUpdateSql = ['@id int', ...paramsSql].toString()
    let updateSql = columns.map(column => `${column} = @${column}`)

    let editProc = `CREATE PROCEDURE proc_Edit${tableNameInProc}
    ${stringParamUpdateSql}
AS
BEGIN
	UPDATE ${table}
	SET
		${updateSql}
	WHERE id = @id;
END;
GO

`

    //delete
    let deleteProc = `CREATE PROCEDURE proc_Delete${tableNameInProc} @id int
AS 
BEGIN
    DELETE FROM ${table}
    WHERE id = @id
END
GO

`
    let getAllProc = `CREATE PROCEDURE proc_getAll${tableNameInProc}
AS
    SELECT * FROM ${table}
GO
`
let getById = `CREATE PROCEDURE proc_get${tableNameInProc}ById @id int
AS
    SELECT * FROM ${table}
    WHERE id = @id
GO

`
    let result = ` --Procedure cho table : ${table} 
    ${createProc} ${editProc} ${deleteProc} ${getAllProc} ${getById}`
    
    return result
}



async function connect() {
    const config = {
        user: 'sa',
        password: 'tung',
        server: 'localhost', // You can use 'localhost\\instance' to connect to named instance
        database: 'web_hoa',
        port: 1433,
        options: {
            enableArithAbort: true,
            encrypt: false
        },
    }
    try {
        let pool = await sql.connect(config)



        let result1 = await pool.request()
            .query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'")
        let tables = result1.recordset.map(obj => obj.TABLE_NAME)

        for (let index = 0; index < tables.length; index++) {
            const table = tables[index];
            let result2 = await pool.request()
                .query(`SELECT   COLUMN_NAME, DATA_TYPE,CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`)

            let columns = result2.recordset.map(obj => obj.COLUMN_NAME)
            var theRemovedElement = columns.shift(); // theRemovedElement == 1

            let columnAndDatatype = result2.recordset.map(result2 => `@${result2.COLUMN_NAME} ${result2.DATA_TYPE} (${result2.CHARACTER_MAXIMUM_LENGTH})`)

            let paramsSql = columnAndDatatype.map(param => param.replace('(null)', ''))
            var theRemovedElement = paramsSql.shift(); // theRemovedElement == 1

            let intoSql = result2.recordset.map(result2 => `@${result2.COLUMN_NAME}`)
            var theRemovedElement = intoSql.shift(); // theRemovedElement == 1

            let option = { paramsSql, intoSql, columns }

            fs.appendFileSync('./proc.sql', CreateProc(table, option), async function (err) {
                if (err)
                    throw err
                else
                    console.log('ghi thanh cong ')
            })
        }


        console.log('đã kết nối')
    } catch (err) {
        console.log(err)
        // ... error checks
    }
}

connect()
// module.exports = { connect };
