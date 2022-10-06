/* Copyright (c) 2020 Intel Corporation.

* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:

* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.

* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

/**
 * Default model settings
 * (sails.config.models)
 *
 * Your default, project-wide model settings. Can also be overridden on a
 * per-model basis by setting a top-level properties in the model definition.
 *
 * For details about all available model settings, see:
 * https://sailsjs.com/config/models
 *
 * For more general background on Sails model settings, and how to configure
 * them on a project-wide or per-model basis, see:
 * https://sailsjs.com/docs/concepts/models-and-orm/model-settings
 */

module.exports.models = {
  /***************************************************************************
   *                                                                          *
   * Whether model methods like `.create()` and `.update()` should ignore     *
   * (and refuse to persist) unrecognized data-- i.e. properties other than   *
   * those explicitly defined by attributes in the model definition.          *
   *                                                                          *
   * To ease future maintenance of your code base, it is usually a good idea  *
   * to set this to `true`.                                                   *
   *                                                                          *
   * > Note that `schema: false` is not supported by every database.          *
   * > For example, if you are using a SQL database, then relevant models     *
   * > are always effectively `schema: true`.  And if no `schema` setting is  *
   * > provided whatsoever, the behavior is left up to the database adapter.  *
   * >                                                                        *
   * > For more info, see:                                                    *
   * > https://sailsjs.com/docs/concepts/orm/model-settings#?schema           *
   *                                                                          *
   ***************************************************************************/

  // schema: true,

  /***************************************************************************
   *                                                                          *
   * How and whether Sails will attempt to automatically rebuild the          *
   * tables/collections/etc. in your schema.                                  *
   *                                                                          *
   * > Note that, when running in a production environment, this will be      *
   * > automatically set to `migrate: 'safe'`, no matter what you configure   *
   * > here.  This is a failsafe to prevent Sails from accidentally running   *
   * > auto-migrations on your production database.                           *
   * >                                                                        *
   * > For more info, see:                                                    *
   * > https://sailsjs.com/docs/concepts/orm/model-settings#?migrate          *
   *                                                                          *
   ***************************************************************************/

  migrate: "alter",

  /***************************************************************************
   *                                                                          *
   * Base attributes that are included in all of your models by default.      *
   * By convention, this is your primary key attribute (`id`), as well as two *
   * other timestamp attributes for tracking when records were last created   *
   * or updated.                                                              *
   *                                                                          *
   * > For more info, see:                                                    *
   * > https://sailsjs.com/docs/concepts/orm/model-settings#?attributes       *
   *                                                                          *
   ***************************************************************************/

  attributes: {
    createdAt: { type: "number", autoCreatedAt: true },
    updatedAt: { type: "number", autoUpdatedAt: true },
    // id: { type: "number", autoIncrement: true }
    id: { type: "string", columnName: "_id" }

    //--------------------------------------------------------------------------
    //  /\   Using MongoDB?
    //  ||   Replace `id` above with this instead:
    //
    // ```
    // id: { type: 'string', columnName: '_id' },
    // ```
    //
    // Plus, don't forget to configure MongoDB as your default datastore:
    // https://sailsjs.com/docs/tutorials/using-mongo-db
    //--------------------------------------------------------------------------
  },

  /******************************************************************************
   *                                                                             *
   * The set of DEKs (data encryption keys) for at-rest encryption.              *
   * i.e. when encrypting/decrypting data for attributes with `encrypt: true`.   *
   *                                                                             *
   * > The `default` DEK is used for all new encryptions, but multiple DEKs      *
   * > can be configured to allow for key rotation.  In production, be sure to   *
   * > manage these keys like you would any other sensitive credential.          *
   *                                                                             *
   * > For more info, see:                                                       *
   * > https://sailsjs.com/docs/concepts/orm/model-settings#?dataEncryptionKeys  *
   *                                                                             *
   ******************************************************************************/

  dataEncryptionKeys: {
    default: "ncf/3tP3UeEwJvQhuSYnhd+zBuVC5enPLfmt1ao1pWA="
  },

  /***************************************************************************
   *                                                                          *
   * Whether or not implicit records for associations should be cleaned up    *
   * automatically using the built-in polyfill.  This is especially useful    *
   * during development with sails-disk.                                      *
   *                                                                          *
   * Depending on which databases you're using, you may want to disable this  *
   * polyfill in your production environment.                                 *
   *                                                                          *
   * (For production configuration, see `config/env/production.js`.)          *
   *                                                                          *
   ***************************************************************************/

  cascadeOnDestroy: true
};
