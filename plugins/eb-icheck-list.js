
(function () {

    $.fn.ebIcheckList = function (config) {

        var self = this;

        eb.ui.prependClass(self, "eb-icheck-list eb-plugin");

        var cmp = new eb.ui.Component(this, config, _defaults(), true);
        var schema = cmp.updateFieldSchema({ id: "Id", name: "Name", label: "Label", selected: "Selected" });
        var cfg = cmp.config();
        var line = (cfg.skin == "line");

        function _init() {
            _ensureComponent(function () {
                cmp.bindData(_bind);
            });
        }

        function _defaults() {
            return {
                autoInit: true,
                skin: "flat",
                color: "blue",
                colorLineUnChecked: null,
                style: {
                    ul: "list-style:none;padding-inline-start:5px",
                    li: "padding-bottom:10px"
                },
                events: { itemClick: { callback: null, dataevent: "dataselect" } }
            };
        }

        function _bind() {

            var d = cmp.data();
            var colId = cmp.colId(schema);
            var t = _template();

            self.empty();

            var root = $("<ul style=\"{0}\">".format(cfg.style.ul));

            self.append(root);
        
            d.Rows.forEach(function (row) {

                var selected = eb.toBoolean(row[schema.selected], false);
                var li = $("<li style=\"{0}\">".format(cfg.style.li));

                root.append(li);

                var input = t.input.format(row[colId], selected ? "checked" : "");
                
                var lbl = t.label.format(typeof row[schema.label] == "undefined" ? row[schema.name] : row[schema.label]);

                li.append(input);

                if(!line)
                    li.append(lbl);
                        
                bindCheck(li.find("input"), selected);

            });

            function bindCheck($this, selected){

                var color = (line && cfg.colorLineUnChecked && !selected) ? cfg.colorLineUnChecked: cfg.color;
                var check = {
                    checkboxClass: 'icheckbox_{0}-{1}'.format(cfg.skin, color),
                    radioClass: 'iradio_{0}-{1}'.format(cfg.skin, color)
                    //increaseArea: '10%'
                };

                if(line)
                    check.insert = t.line + "<span>label</span>";

                $this.iCheck(check).on('ifChecked', function(event){                
                    checkChanged(event, true, this);
                }).on('ifUnchecked', function(event){
                    checkChanged(event, false, this);
                });

                // replace line label with one inserted into li
                $this.closest("li").find("span").text($this.val());

            }

            function checkChanged (e, checked, _this) {

                // change disable color
                if(line && cfg.colorLineUnChecked)
                    bindCheck($(_this), checked)

                // send out data event
                var value = $(_this).val();
                var row = d.where().eq(colId, value).first();

                // data event               
                var ev = new eb.data.DataEvent().source(self)
                .cell(colId, value)
                .column(d.getColumn(colId))
                .row(row)
                .table(d);

                var sel = typeof row[schema.selected] != "undefined";

                if (checked) {
                    if (sel) row[schema.selected] = true;
                    ev.action().add();
                }
                else {
                    if (sel) row[schema.selected] = false;
                    ev.action().remove();
                }

                var ed = { base: e, data: ev.getData() };

                if (cfg.events.itemClick.callback) {
                    cfg.events.itemClick.callback(ed);
                }

                if (cfg.events.itemClick.dataevent) {
                    ev.event(cfg.events.itemClick.dataevent)
                        .element(cmp.ListenerId(cfg.events.itemClick.dataevent))
                        .raise();
                }

                // local event
                self.trigger('itemClick', ed);

                // write back
                if (d.__meta && d.__meta.dataset) {

                    try {

                        if (this.checked) {
                            if (d.__meta.dataset.Write) {
                                d.__meta.dataset.write(row);
                            }
                        }
                        else
                            if (d.__meta.dataset.Delete != false && d.__meta.dataset.Write) {

                                var del = eb.data.delete().from(d.__meta.dataset.Query.Entities[0].Name).where()
                                    .eq(colId, value);

                                d.__meta.dataset.delete(del);
                            }
                    }

                    catch (ex) {
                        eb.ui.ErrorDialog(ex);
                    }
                }

            }

            cmp.ready();

        }

        function _template() {
            return  {
                    input: "<input type=\"checkbox\" value=\"{0}\" {1}>", 
                    label: "<label style=\"padding-left:10px\">{0}</label>",
                    line: "<div class=\"icheck_line-icon\"></div>"
            };
        }

        function _ensureComponent(cb) {

            if (typeof $.fn.iCheck == 'undefined'){
                eb.loadCss({css:'https://cdn.wirebootstrap.com/libs/iCheck/skins/{0}/_all.css?skin={0}'.format(cfg.skin), hidden:"eb-icheck-{0}-hidden".format(cfg.skin)});
                eb.loadJs("https://cdn.wirebootstrap.com/libs/iCheck/js/1.0.2/icheck.min.js?v=1.0.2", cb);
            }
            else
                cb();
        }

        this.getData = function () {
            return cmp.data();
        }

        this.config = function () {
            return cfg;
        }

        this.databind = function () {
            _bind();
        }

        this.initialize = function () {
            _init();
            return this;
        }

        if (cfg.autoInit)
            _init();

        return this;
    }

})();

