import { Component, OnInit } from '@angular/core';
import { Config } from "@/config";
import { FileService } from "@/providers/file-service";
import * as print  from 'print-js';

@Component({
    selector: 'app-certificate-record',
    templateUrl: './certificate-record.html',
    styleUrls: ['./certificate-record.scss']
})
export class CertificateRecord implements OnInit {

    public collection: any = {};

    public certificateToSeeVisible = false;

    public details: any = {};

    public ossPath: string;

    constructor(
        private fileService: FileService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
    }

    public setCollection(collection) {
        this.collection = collection;
    }

    public certificateToSee(item) {
        this.details = item;
        this.certificateToSeeVisible = true;
    }

    public closeDrawer() {
        this.certificateToSeeVisible = false;
        this.details = {
            certificate: null,
        };
    }

    public print() {
        const src = this.ossPath +  this.details.certificate;
        print(src, 'image')
    }

}
