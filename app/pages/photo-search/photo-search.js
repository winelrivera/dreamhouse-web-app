import {Page, NavController} from 'ionic-angular';
import {SearchService} from '../../services/search-service';
import {PhotoSearchPropertyListPage} from './photo-search-property-list';

@Page({
    templateUrl: 'build/pages/photo-search/photo-search.html'
})
export class PhotoSearchPage {

    static get parameters() {
        return [[NavController], [SearchService]];
    }

    constructor(nav, searchService) {
        this.nav = nav;
        this.searchService = searchService;
        this.searching = false;
    }

    photoSelected(event) {
        var that = this;
        var file = event.target.files[0];

        this.searching = true;

        this.searchService.findByImage(file, function(json) {
            that.searching = false;
            that.nav.push(PhotoSearchPropertyListPage, {
                properties: json
            });
        });
    }

}
