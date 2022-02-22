import { utils, write} from 'xlsx';

export class Export {

    public type: 'xlsx' | 'csv';

    public filename: string;

    constructor(filename: string = 'download', type: 'xlsx' | 'csv' = 'xlsx') {
        this.type = type;
        this.filename = filename + '.' + 'xlsx';
    }

    public write(data: any) {
        let array = [];
        let len = data.table[0].length;
        let merges = [];

        if ("title" in data) {
            array.unshift([data.title]);
            merges.push({
                s: {
                    c: 0,
                    r: 0,
                },
                e: {
                    c: len - 1,
                    r: 0,
                }
            })
        }

        if ("merges" in data) {
            merges = [...merges, ...data.merges];
        }

        array = [...array, ...data.table];

        let ws = utils.aoa_to_sheet(array);
        ws['!merges'] = merges;

        let wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'Sheet1');

        const wbout = write(wb, { bookType: this.type, type: 'binary' });

        this._saveAs(new Blob([this._s2ab(wbout)]), this.filename);
    }

    private _s2ab(str: string): ArrayBuffer {
        let buff = new ArrayBuffer(str.length);
        let view = new Uint8Array(buff);
        for (let i = 0; i !== str.length; ++i) {
            view[i] = str.charCodeAt(i) & 0xFF;
        }
        return buff;
    }

    private _saveAs(data: Blob, fileName: string): void {
        if (window.navigator.msSaveOrOpenBlob) {
            navigator.msSaveBlob(data, fileName);
        } else {
            let link = document.createElement('a');
            link.download = fileName;
            link.href = window.URL.createObjectURL(data);
            link.click();
            window.URL.revokeObjectURL(link.href);
        }
    }
}
