import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, Cache } from '@yilu-tech/ny';
import { FileService, ROUTES_INFO } from '@/providers/index';
import { PacService } from '@/providers/permission';
import { Config } from '@/config';

@Component({
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    public bgTransparent = true;

    public hiddenContentMargin = true;

    public links: { label: string, path: string, action?: string, disabled?: boolean }[] = []

    public avatar: string;

    public user: any;

    public allLinks: any[] = [];

    constructor(private auth: Auth, private cache: Cache, private router: Router, private file: FileService, private pac: PacService) {
        this.user = this.auth.user()
    }

    ngOnInit() {
        if (this.user.avatar) {
            this.file.getBucketInfo(Config.buckets['admin']).then((path) => {
                this.avatar = path + this.user.avatar;
            })
        } else {
            this.avatar = '../../../../assets/img/logo-108.png';
        }
        this.pac.stored().then(() => {
            this.generateLinks().initLinks();
        })
    }

    private initLinks() {
        let links = this.cache.get(this.getLinkCacheKey()) || []

        this.links = [];

        for (let str of links) {
            let parts = str.split('#', 2)
            let link = this.allLinks.find((_) => _.path == parts[0] && _.action == parts[1]);
            if (link) {
                link.checked = true;
                this.links.push(link);
            }
        }
    }

    private generateLinks() {
        this.allLinks = [];
        for (let path in ROUTES_INFO) {
            let info = ROUTES_INFO[path];
            this.allLinks.push({ path, label: info.label, disabled: this.linkDisabled(info) });

            if (!info.actions) {
                continue;
            }

            for (let action in info.actions) {
                let child = info.actions[action];
                this.allLinks.push({ path, action, label: child.label, disabled: this.linkDisabled(child) })
            }
        }
        return this;
    }

    private linkDisabled(info) {
        return !this.pac.exists(info.name, info.group || '')
    }

    private getLinkCacheKey() {
        return 'LINKS_' + btoa(this.user.id).replace(/=/g, '');
    }
}
