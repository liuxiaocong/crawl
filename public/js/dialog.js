/*
 * opt = {
 *  @title:
 *  @msg:
 *  @okBtn:
 *  @cancelBtn:
 *  @showCancelBtn: default=true
 *  @showOkBtn: default=true
 *  @callback: ok callback handler
 *  @actions: false
 *
 *  @return: dialog element
 * }
 */
(function (utils) {
    var uuid = 0;
    utils.dialog = function (opt) {
        var opt = utils.extend({
                id: 'dialog_' + uuid++,
                type: 'alert',
                title: 'untitled',
                msg: "",
                okBtn: 'ok',
                cancelBtn: 'cancel',
                showCancelBtn: true,
                showOkBtn: true,
                okBtnAutoclose: true,
                callback: undefined,
                bindfunction: undefined,
                showTitle: true
            },
            opt);
        var exports = this;
        var tmpl = mquery('#tmpl_dialog').html();
        var screenEl = utils.TemplateEngine(tmpl, opt)
        mquery(document.body).append(screenEl);

        var node = mquery('#' + opt.id);
        exports.node = node;
        exports.close = function () {
            node.remove();
            mquery(document.body).css('overflow', "auto");
        };

        node.find('.btnCancel').bind('click', exports.close);
        if (opt.okBtnAutoclose) {
            node.find('.btnOk').bind('click', exports.close);
        }
        node.find('.btnOk').bind('click', function () {
            if (opt.callback)
                opt.callback.apply(exports);
        });
        if (opt.bindfunction) {
            opt.bindfunction.apply(node);
        }
        node.show();
        mquery(document.body).css('overflow', 'hidden');

        return exports;
    };
    utils.alert = function (title, msg) {
        return new utils.dialog({
            title: title,
            msg: msg,
            showCancelBtn: false,
        });
    };

})(utils || {});
