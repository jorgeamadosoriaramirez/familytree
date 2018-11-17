//default profile for person nodes
var defaultProfile = 'https://img.icons8.com/metro/1600/gender-neutral-user.png';

//constants for node types
var MAN = 'man';
var WOMAN = 'woman';
var OTHER = 'other';
var MARRIAGE = 'marriage';
var RELATIONSHIP = 'relationship';

//important to position the invisible nodes. Could be extended to the other nodes as well, if need be.
var DEBUG = false;
//to debug tree positioning by allowing the dragging of nodes
var AUTOLOCK = true;
//id counter for person nodes
var idPerson = 1;
//default tree to load if none is specified
DEFAULT_TREE = 'jasr';

class Graph {

    constructor(name, selector) {
        this.name = name;
        this.elements = [];
        this.selector = selector;
    }

    //used to create a person data, which is later included in a person node
    person(name, nickname, gender, birth, death, comments, profile, photos) {
        return {
            birth: birth,
            death: death,
            nickname: nickname,
            comments: comments,
            photos: photos,
            name: name,
            profile: profile,
            classes: gender
        };
    }

    relationshipNode(row, col, people, date, classes) {
        //  console.log(people);
        return {
            data: {
                row: row,
                col: col,
                id: this.relId(people),
                relationship: {
                    tip: date
                },
                debug: DEBUG ? this.relId(people) : ''
            },
            classes: classes
        };
    }

    personNode(row, col, person) {
        person.id = idPerson++;
        //cytoscape node format
        return {
            data: {
                row: row,
                col: col,
                id: person.id,
                person: person,
                debug: DEBUG ? person.id : ''
            },
            classes: person.gender
        };
    }

    treeRefNode(row, col, person) {
        return {
            data: {
                row: row + .25,
                col: col + .2,
                id: person.treeRef,
                debug: DEBUG ? person.treeRef : ''
            },
            classes: 'tree'
        };
    }

    moreId(node) {
        return 'more-' + node.id;
    }

    relId(people) {
        //   console.log('rel id' + JSON.stringify(people));
        //   console.log('rel ' + people.map(ele => ele.id).reduce((acc, person) => acc += '-' + person));
        return 'rel-' + people.map(ele => ele.id).reduce((acc, person) => acc += '-' + person);
    }

    relNode(row, col, relationship, peopleArray) {
        var relNode = this.relationshipNode(row, col, peopleArray.map((ele) => ele instanceof Array ? ele[0] : ele),
            relationship.date, relationship.type);
        relationship.id = relNode.data.id;

        var results = [];
        results.push(relNode);
        for (var i = 0; i < peopleArray.length; i++) {

            if (peopleArray && i < peopleArray.length && peopleArray[i] instanceof Array) {
                results.push(...this.edge(relNode.data, peopleArray[i][0], peopleArray[i].slice(1)));
            } else
                results.push(...this.edge(relNode.data, peopleArray[i]));
        }
        return results;
    }

    moreNode(row, col, node, invNodes) {
        var moreId = 'more-' + node.id;
        var moreNode = {
            id: moreId,
            data: {
                row: row,
                col: col,
                id: moreId,
                relationship: {
                    tip: node.moreComment
                },
                debug: DEBUG ? node.id : ''
            },
            classes: 'more'
        };
        return [moreNode,
            ...this.edge(node, moreNode, invNodes)
        ];
    }

    invNode(row, col, id) {
        return {
            data: {
                id: id,
                row: row,
                col: col,
                debug: DEBUG ? id : ''
            },
            classes: "invisible"
        };
    }

    edge(source, target, invArray) {
        var sourceId = source.id;
        var targetId = target.id;
        var result = [];
        if (invArray && invArray.length) {

            var id = 1;
            var invNodes = invArray.map((val) => this.invNode(val[0], val[1], 'inv-' + sourceId + '-' + targetId + '-' + id++));

            result.unshift({
                data: {
                    source: sourceId,
                    target: invNodes[0].data.id
                }
            });
            result.push({
                data: {
                    source: invNodes[invNodes.length - 1].data.id,
                    target: targetId
                }
            });
            result.push(...invNodes);

            for (var i = 0; i < invNodes.length - 1; i++) {
                result.push({
                    data: {
                        source: invNodes[i].data.id,
                        target: invNodes[i + 1].data.id
                    }
                });
            }
        } else {
            result.push({
                data: {
                    source: sourceId,
                    target: targetId
                }
            });
        }

        return result;
    }

    add(row, col, node, peopleArray) {
        if ('name' in node) {
            this.elements.push(this.personNode(row, col, node));
            console.log(JSON.stringify(node));
            if ('treeRef' in node)
                this.elements.push(this.treeRefNode(row, col, node));
        } else
            this.elements.push(...this.relNode(row, col, node, peopleArray));
    }

    more(row, col, node, invNodes) {
        this.elements.push(...this.moreNode(row, col, node, invNodes));
    }

    rel(node1, node2, invNodes) {
        this.elements.push(...this.edge(node1, node2, invNodes));
    }

    createCytoscape() {
        this.cy = cytoscape({
            container: $(this.selector), // container to render in
            elements: this.elements,
            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        'width': 100,
                        'height': 100,
                        'text-valign': 'bottom',
                        'color': 'white',
                        'text-outline-width': 2,
                        'text-outline-color': '#888',
                        'background-fit': 'contain'
                    }
                }, {
                    selector: 'node.invisible',
                    style: {
                        'width': 1,
                        'height': 1,
                        'background-color': '#ccc',
                        'label': 'data(debug)'
                    }
                }, {
                    selector: 'node.people',
                    style: {
                        'background-image': 'data(person.profile)'
                    }
                }, {
                    selector: 'node.woman',
                    style: {
                        'label': 'data(person.name)',
                        'background-color': 'pink',
                        'background-image': 'data(person.profile)'
                    }
                }, {
                    selector: 'node.man',
                    style: {
                        'label': 'data(person.name)',
                        'background-color': 'lightblue',
                        'background-image': 'data(person.profile)'
                    }
                }, {
                    selector: 'node.other',
                    style: {
                        'label': 'data(person.name)',
                        'background-color': 'lightgrey',
                        'background-image': 'data(person.profile)'
                    }
                }, {
                    selector: 'node.tree',
                    style: {
                        'width': 40,
                        'height': 40,
                        'label': '',
                        'text-outline-width': 2,
                        'text-outline-color': '#888',
                        'background-color':'white',
                        'background-image': 'img/tree.png'
                    }
                }, {
                    selector: 'node.marriage',
                    style: {
                        'width': 40,
                        'height': 40,
                        'label': '',
                        'background-image': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg81vgI01MmrRytuKKhxgo7NqAT0XcCKBsYFBClBr2rNqASEBr'
                    }
                }, {
                    selector: 'node.relationship',
                    style: {
                        'width': 40,
                        'height': 40,
                        'label': '',
                        'background-image': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStN8H_mBNznW0odQqBD6qgjKEUMR7dxlK1SsWYJKh-YfLds5UK',
                    }
                }, {
                    selector: 'node.more',
                    style: {
                        'width': 40,
                        'height': 40,
                        'label': '',
                        'background-image': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrIjAZsDAbHCbkfxBAMUDtBvEKNkVJ0rkUeKMzEJV8yjigrW6M',
                    }
                }, {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc'
                    }
                }
            ],
            layout: {

                name: 'grid',
                position: function (node) {
                    return node._private.data;
                },
                rows: 8,
                col: 5
            }
        });
        this.cy.autolock(AUTOLOCK);

        //detail model function
        var modalFn = function (evt) {
            var node = evt.target;
            //clear modal and hide all elements. they will be shown if data exists on each one
            $("div#person.modal #birth").text('');
            $("div#person.modal #name").text('');
            $("div#person.modal #nickname").text('');
            $("div#person.modal #death").text('');
            $("div#person.modal #comments").text('');
            $("div#person.modal #photos").find(".carousel-inner").empty();
            $("div#person.modal #nickname-content").hide();
            $("div#person.modal #birth-content").hide();
            $("div#person.modal #death-content").hide();
            $("div#person.modal #comments").hide();
            $("div#person.modal #photos").hide();
            //-----------------------------------
            //add data to modal elements
            $("div#person.modal #name").text(node.data().person.name);

            if (node.data().person.nickname)
                $("div#person.modal #nickname-content").show().find("#nickname").text(node.data().person.nickname);

            if (node.data().person.birth)
                $("div#person.modal #birth-content").show().find("#birth").text(node.data().person.birth);

            if (node.data().person.death)
                $("div#person.modal #death-content").show().find("#death").text(node.data().person.death);

            if (node.data().person.comments)
                $("div#person.modal #comments").show().text(node.data().person.comments);


            if (node.data().person.photos) {
                $.each(node.data().person.photos, function (idx, val) {
                    var template = $("#carousel-template").clone();
                    template.toggleClass("hidden").attr('id', '').find("img").attr("src", val);
                    $("div#person.modal #photos .carousel-inner").prepend(template);
                })
                $("div#person.modal #photos").show().find(".carousel-item").first().toggleClass("active");
            }
            //-----------------------------------
            $("div#person.modal").modal('toggle');
        };

        //bind event to people nodes to launch modal
        this.cy.on('tap', 'node.man', modalFn);
        this.cy.on('tap', 'node.woman', modalFn);
        this.cy.on('tap', 'node.other', modalFn);
        //-----------------------------------
        //-----marriage/relationship detail function with tippy, not modal-----
        var makeTippy = function (node, text) {
            return tippy(node.popperRef(), {
                html: (function () {
                    var div = document.createElement('div');
                    div.innerHTML = text;
                    return div;
                })(),
                arrow: true,
                multiple: false,
                animation: 'perspective',
                trigger: 'mouseenter',
                sticky: true,
                placement: 'top'
            }).tooltips[0];
        };
        this.cy.on('mouseover', 'node.marriage,node.relationship,node.more', function (evt) {
            var node = evt.target;
            var tippyA = makeTippy(node, node.data().relationship.tip);
            tippyA.show();
        });

        this.cy.on('tap', 'node.tree', function(evt){
            window.location.href = 'home.html?tree=' + evt.target.data().id;
        });
        //--------------------------------------------
        return this.cy;
    }
}

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? DEFAULT_TREE : decodeURIComponent(sParameterName[1]);
        }
    }

    return DEFAULT_TREE;
};