
!function (ns, tui) {
    'use strict';

    var $ = tui.$;

    var Point = tui.Point;
    var Size = tui.Size;
    var Rect = tui.Rect;

    var Image = tui.Image;
    var Link = tui.Link;
    var Label = tui.Label;
    var Button = tui.Button;
    var Window = tui.Window;

    var random_point = function () {
        var x = 50 + Math.random() * 100;
        var y = 50 + Math.random() * 100;
        return new Point(Math.round(x), Math.round(y));
    };

    var AboutWindow = function () {
        var frame = new Rect(random_point(), new Size(240, 360));
        Window.call(this, frame);
        this.setId('aboutWindow');
        this.setClassName('aboutWindow');
        this.setTitle('About DICQ');
        // banner
        var banner = new Image();
        banner.setClassName('banner');
        banner.setSrc('https://dimchat.github.io/images/icon-512.png');
        this.appendChild(banner);
        // link
        var link = new Link();
        link.setText('https://dim.chat/');
        link.setURL('https://dim.chat/');
        this.appendChild(link);
        // version
        var version = new Label();
        version.setClassName('version');
        version.setText('DICQ 2020\nPowered by DIMP');
        this.appendChild(version);
        // copyright
        var copyright = new Label();
        copyright.setClassName('copyright');
        copyright.setText('Albert Moky @2020');
        this.appendChild(copyright);
        // button
        var button = new Button();
        button.setClassName('OK');
        button.setText('OK');
        var win = this;
        button.onClick = function () {
            win.remove();
        };
        this.appendChild(button);
    };
    AboutWindow.prototype = Object.create(Window.prototype);
    AboutWindow.prototype.constructor = AboutWindow;

    AboutWindow.show = function () {
        var box = document.getElementById('aboutWindow');
        if (box) {
            box = $(box);
        } else {
            box = new AboutWindow();
            $(document.body).appendChild(box);
        }
        box.floatToTop();
        return box;
    };

    ns.AboutWindow = AboutWindow;

}(window, tarsier.ui);
