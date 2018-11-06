//  This search uses the Algolia autcomplete js to integrate our docs search index and
//  our zendesk search index
//  Tutorial link with boilerplate below:
//  https://www.algolia.com/doc/tutorials/search-ui/autocomplete/how-to-display-results-from-multiple-indices-with-autocomplete-js/?language=php#teams-1

var client = algoliasearch("Z4XANBDB47", "6f287f2adec130b7ad015e1e09a92a6d")

var datasets = [
    {
        index: client.initIndex("user_content_production"),
        website: 'https://docs.okera.com',
        linkatt: 'url',
    },
    {
        index: client.initIndex("zendesk_okera_articles"),
        website: 'https://okera.zendesk.com/hc/en-us/articles/',
        linkatt: 'id',
    }
]

autocomplete('#aa-search-input', {
    templates: {
        //add search by algolia logo
        footer: '<div class="branding">Search by <img src="https://www.algolia.com/static_assets/images/press/downloads/algolia-logo-light.svg" /></div>',
    }
}, [
        {
            source: autocomplete.sources.hits(datasets[0].index, { hitsPerPage: 3 }),
            displayKey: 'Title',
            templates: {
                header: '<div class="aa-suggestions-category">Okera Documentation</div>',
                suggestion: function (suggestion) {
                    var headingToShow = '';
                    if (
                        // If there are any headings
                        typeof suggestion.headings !== 'undefined' &&
                        // If there are at least 2 entries in headings
                        suggestion.headings.length > 1) {

                        // Start at 1, we want to skip the first heading because it
                        // is the title. Now, find the first defined entry in headings to show.
                        for (var i = 1; i < suggestion.headings.length; i++) {
                            if (suggestion.headings[i]) {
                                headingToShow = suggestion.headings[i];
                                break;
                            }
                        }
                    }

                    var headingHtml = '';
                    if (headingToShow) {
                        headingHtml = '<span class="aa-suggestions-subheading">' + headingToShow + '</span>';
                    }

                    if (typeof suggestion.title === 'undefined') {
                        // if title is undefined, show the first heading
                        return '<span class="aa-suggestions-okera-heading">' + suggestion.headings[0] +
                            '<p class="aa-suggestions-preview">' + suggestion._snippetResult.content.value + '</p>';
                    } else {
                        return '<span class="aa-suggestions-okera-heading">' + suggestion._highlightResult.title.value + '</span><br>' + headingHtml +
                            '<br><p class="aa-suggestions-preview">' + suggestion._snippetResult.content.value + '</p>';
                    }
                }
            }
        },
        {
            source: autocomplete.sources.hits(datasets[1].index, { hitsPerPage: 3 }),
            templates: {
                header: '<div class="aa-suggestions-category">Zendesk Knowledgebase</div>',
                suggestion: function (suggestion) {
                    return '<span class="aa-suggestions-okera-heading">' +
                        suggestion._highlightResult.title.value + '</span><br><p class="aa-suggestions-preview">' + suggestion._snippetResult.body_safe.value + '</p>';
                }
            }
        }
    ]).on("autocomplete:selected", function (event, suggestion, dataset) {
        // 1-indexed dataset
        var website = datasets[dataset - 1].website
        //adds the correct url to the search result
        if (dataset == 1) {
            location.href = website + suggestion.url + '#' + suggestion.anchor
        } else {
            location.href = website + suggestion.id
        }
    });