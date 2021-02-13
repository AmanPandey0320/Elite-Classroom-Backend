const { nanoid } = require('nanoid');
const pool = require('../../config/database');

module.exports = {
  createClassroom: ({ className, google_token }) => {
    return new Promise(async (resolve, reject) => {
      let classCode = nanoid(20);
      let sql =
        'INSERT INTO classroom (class_code, class_name, owner_id ) VALUES (?, ?, (SELECT user_id FROM users WHERE google_token = ?))';

      await pool.query(
        sql,
        [classCode, className, google_token],
        async (error, result, field) => {
          if (error) {
            return reject({
              status: 500,
              error,
            });
          }

          //  inserting owner into the classroom made
          let insertOwner =
            'INSERT INTO classes (user_id, class_code) VALUES ((SELECT user_id FROM users WHERE google_token = ?), ?)';

          await pool.query(
            insertOwner,
            [google_token, classCode],
            (error, result, field) => {
              if (error) {
                return reject({
                  status: 500,
                  error,
                });
              }
              return resolve(result);
            }
          );
        }
      );
    });
  },

  joinClassroom: ({ classCode, google_token }) => {
    return new Promise(async (resolve, reject) => {
      let sqlFindUser = 'SELECT user_id FROM users WHERE google_token = ?'; //  checking if the user is in the database

      await pool.query(
        sqlFindUser,
        [google_token],
        async (error, result, field) => {
          if (error) {
            return reject({
              status: 500,
              error,
            });
          }

          if (result.length === 0) {
            return reject({
              status: 400,
              error,
              message: 'User is not registered',
            });
          }

          let sqlFindClass =
            'SELECT class_code FROM classroom WHERE class_code = ?';

          await pool.query(
            sqlFindClass,
            [classCode],
            async (error, result, field) => {
              if (error) {
                return reject({
                  status: 500,
                  error,
                });
              }

              if (result.length === 0) {
                return reject({
                  status: 400,
                  error,
                  message: 'Class does not exist',
                });
              }

              let sqlFindUserInClass =
                'SELECT classes.user_id FROM classes JOIN users ON (users.user_id = classes.user_id AND users.google_token = ?) WHERE classes.class_code = ?';

              await pool.query(
                sqlFindUserInClass,
                [google_token, classCode],
                async (error, result, field) => {
                  if (error) {
                    return reject({
                      status: 500,
                      error,
                    });
                  }

                  if (result.length !== 0) {
                    return reject({
                      status: 500,
                      error,
                      message: 'User already in classroom',
                    });
                  }

                  let sqlInsertUserInClass =
                    'INSERT INTO classes (user_id, class_code) VAlUES ((SELECT user_id FROM users WHERE google_token = ?), ?)';
                  await pool.query(
                    sqlInsertUserInClass,
                    [google_token, classCode],
                    (error, result, field) => {
                      if (error) {
                        return reject({
                          status: 500,
                          error,
                        });
                      }

                      return resolve(result);
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  },
};
