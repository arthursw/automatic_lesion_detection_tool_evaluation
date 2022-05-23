papaya.Container.syncViewers = true;

// Remove smooth display:
papaya.utilities.UrlUtils.createCookie(papaya.viewer.Preferences.COOKIE_PREFIX + 'smoothDisplay', 'No', papaya.viewer.Preferences.COOKIE_EXPIRY_DAYS);
papaya.utilities.UrlUtils.createCookie(papaya.viewer.Preferences.COOKIE_PREFIX + 'showOrientation', 'Yes', papaya.viewer.Preferences.COOKIE_EXPIRY_DAYS);
papaya.viewer.Viewer.MAX_OVERLAYS = 12;

// To draw / change the data of a volume:
// papayaContainers[0].viewer.screenVolumes[3].volume.imageData.data[i] = 1

papaya.Container.atlasWorldSpace = false
var params = [];

params['images'] = [];

let current_patient_index = 0;

let archive = null;
let image_files = null;
let task = {};
let patients = [];
let grid = null;
// let initialized = false;
// let segmentation_data = null;

let show_loader = () => {
    let loader = document.getElementById('loader')
    loader.classList.remove('hide')
}

let hide_loader = () => {
    let loader = document.getElementById('loader')
    loader.classList.add('hide')
}

let create_checkbox = (name, image_index, visible) => {
    let container = document.getElementById('toggle-visibility-buttons')

    {/* <div>
        <label for='checkbox_name'>name</label>
        <input type='checkbox' name='name' id='checkbox_name'>
    </div> */}

    let div = document.createElement('div');
    div.classList.add('checkbox')
    let label = document.createElement('label');
    label.setAttribute('for', 'checkbox_' + name)
    label.innerText = name
    let input = document.createElement('input');
    input.setAttribute('type', 'checkbox')
    input.setAttribute('id', 'checkbox_' + name)
    input.setAttribute('name', name)
    input.checked = visible
    input.disabled = true
    div.appendChild(input)
    div.appendChild(label)
    container.appendChild(div);

    input.addEventListener('change', (event) => {
        if(event.target.checked) {
            if(image_index < papayaContainers[1].viewer.screenVolumes.length || papayaContainers[1].viewer.loadingVolume != null) {
                papaya.Container.showImage(1, image_index)
            }
        } else {
            if(image_index < papayaContainers[1].viewer.screenVolumes.length || papayaContainers[1].viewer.loadingVolume != null) {
                papaya.Container.hideImage(1, image_index)
            }
        }
    })
}

// let create_toggle_button = (button_name, image_index, visible) => {
//     let container = document.getElementById('toggle-visibility-buttons')
//     let toggle_button = document.createElement('button');
//     toggle_button.innerHTML = visible ? 'Hide ' + button_name : 'Show ' + button_name;
//     container.appendChild(toggle_button);
//     toggle_button.setAttribute('data-visible', visible ? 'true' : 'false')
//     toggle_button.addEventListener('click', () => {
//         let visible = toggle_button.getAttribute('data-visible')
//         if (visible == 'true') {
//             papaya.Container.hideImage(1, image_index)
//             toggle_button.innerHTML = 'Show ' + button_name
//             toggle_button.setAttribute('data-visible', 'false')
//         } else {
//             papaya.Container.showImage(1, image_index)
//             toggle_button.innerHTML = 'Hide ' + button_name
//             toggle_button.setAttribute('data-visible', 'true')
//         }
//     })
// }

let loaded_images = []
let current_image_index = 0

let load_patient_viewer = (images, image_parameters, patient, patient_index) => {

    for (let li of loaded_images) {
        delete window[li.name]
    }
    loaded_images = []
    current_image_index = 0
    params = {}

    if(archive != null) {
        params['encodedImages'] = []
    } else {
        params["files"] = images
    }

    let image_index = 0;
    // let screen_volumes = []
    for (let image_parameter of image_parameters) {

        let file_name = image_parameter.file_name
        let parameters = image_parameter.parameters
        let image_name = archive != null ? 'patient_viewer_' + file_name.replace('/', '_').replace('.nii.gz', '') : file_name.split('/').at(-1)
        if(archive != null) {
            params['encodedImages'].push(image_name)
        }
        window[image_name] = images[image_index]
        let display_name = image_parameter.name || file_name.split('/').at(-1)
        loaded_images.push({ name: image_name, file_name: file_name, index: image_index, display_name: display_name })
        params[image_name] = parameters
        if(display_name == 'segmentation') {
            create_checkbox(display_name, image_index, image_parameter.display)
        }
        image_parameter.image_index = image_index
        image_index++
    }
    current_image_index = loaded_images.length-1
    params['worldSpace'] = false
    params['coordinate'] = patient['location_voxel']
    params['smoothDisplay'] = false
    params['ignoreNiftiTransforms'] = true
    params['loadingComplete'] = () => {
        go_to_patient(patients[current_patient_index])
        for (let image_parameter of image_parameters) {
            if (image_parameter.display != null && !image_parameter.display) {
                papaya.Container.hideImage(1, image_parameter.image_index)
            }
        }

        let container = document.getElementById('toggle-visibility-buttons')
        let checkboxes = document.getElementsByTagName('input')
        for(let checkbox of checkboxes) {
            checkbox.disabled = false
        }
        // let sv = papayaContainers[0].viewer.screenVolumes
        // let volume = sv[sv.length - 1].volume
        // let data = volume.imageData.data
        // for (let i = 0; i < data.length; i++) {
        //     // data[i] = 0
        // }
        // segmentation_data = data
        // papayaContainers[0].viewer.drawViewer(true, false);
    }

    // let description = document.getElementById('description')
    // description.innerText = `${patient['name']} - ${patient_index + 1}/${patients.length}`
    
    papaya.Container.resetViewer(1, params);

    if(archive != null) {
        params['encodedImages'] = [params['encodedImages'][0]]
    } else {
        params['files'] = [images[0]]
    }

    params['loadingComplete'] = null
    papaya.Container.resetViewer(0, params);

    hide_loader()

    patient.start_time = Date.now()

    // if (!initialized) {
    //     initialized = true;
    // let canvas = papayaContainers[0].viewer.canvas
    // canvas.addEventListener('mousemove', listenerMouseMove, false);
    // canvas.addEventListener('mousedown', listenerMouseDown, false);
    // canvas.addEventListener('mouseup', listenerMouseUp, false);
    // }
}

let dragging = false

// let listenerMouseMove = (event) => {
//     if (dragging) {

//         let viewer = papayaContainers[0].viewer
//         let currentMouseX = papaya.utilities.PlatformUtils.getMousePositionX(event);
//         let currentMouseY = papaya.utilities.PlatformUtils.getMousePositionY(event);

//         // let x = viewer.convertScreenToImageCoordinateX(currentMouseX - viewer.canvasRect.left, viewer.selectedSlice);
//         // let y = viewer.convertScreenToImageCoordinateY(currentMouseY - viewer.canvasRect.top, viewer.selectedSlice);
//         // let coord = viewer.convertCurrentCoordinateToScreen(viewer.selectedSlice);
//         let x = viewer.currentCoord.x
//         let y = viewer.currentCoord.y
//         let z = viewer.selectedSlice.currentSlice;
//         console.log(x, y, z)
//         let sv = papayaContainers[0].viewer.screenVolumes
//         let volume = sv[sv.length - 1].volume

//         let viewer_volume = papayaContainers[0].viewer.volume
//         // let xDim = viewer_volume.getXDim()
//         // let yDim = viewer_volume.getYDim()
//         // let zDim = viewer_volume.getZDim()
//         // let offset = papayaContainers[0].viewer.volume.transform.voxelValue.orientation.convertIndexToOffset(coord.x, coord.y, coord.z)
//         let offset = papayaContainers[0].viewer.volume.transform.voxelValue.orientation.convertIndexToOffset(x, y, z)
//         console.log(offset)
//         // let offset = papayaContainers[0].viewer.volume.transform.voxelValue.orientation.convertIndexToOffsetNative(x, y, z)
//         // segmentation_data[offset] = !segmentation_data[offset]
//         // console.log(!segmentation_data[offset])
//         // let index = ((y * xDim) + x) * 4;
//         // for (let i = 0; i < segmentation_data.length; i++) {
//         //     segmentation_data[i] = i % 5
//         // }
//         // segmentation_data[x+y*xDim+z*xDim*yDim] = 1
//         // segmentation_data[z+y*zDim+x*zDim*yDim] = 1
//         // segmentation_data[y+x*yDim+z*xDim*yDim] = 1

//         papayaContainers[0].viewer.drawViewer(true, false);
//     }
// }

// let listenerMouseDown = (event) => {
//     dragging = true
// }

// let listenerMouseUp = (event) => {
//     dragging = false
// }

let go_to_world_coordinates = (loc) => {
    var coord = new papaya.core.Coordinate();
    papayaContainers[0].viewer.getIndexCoordinateAtWorld(-loc[0], -loc[1], loc[2], coord);
    papayaContainers[0].viewer.gotoCoordinate(coord)
}

let go_to_voxel_coordinates = (loc) => {
    var coord = new papaya.core.Coordinate();
    coord.x = loc[0];
    coord.y = loc[1];
    coord.z = loc[2];
    papayaContainers[0].viewer.gotoCoordinate(coord)
}

let patient_location_to_voxel_coordinates = (loc) => {
    if(typeof(loc) == 'string') {
        loc = JSON.parse(loc)
    }
    let orientation = papayaContainers[0].viewer.screenVolumes[0].volume.header.orientation.orientation
    if(!orientation.startsWith('XYZ')) {
        console.log('Warning, image orientation is not XYZ')
    }
    let xDim = papayaContainers[0].viewer.volume.getXDim() - 1
    let yDim = papayaContainers[0].viewer.volume.getYDim() - 1
    let zDim = papayaContainers[0].viewer.volume.getZDim() - 1
    let xIndex = orientation.indexOf('X')
    let yIndex = orientation.indexOf('Y')
    let zIndex = orientation.indexOf('Z')
    let invertX = orientation[3+xIndex] == '-'
    let invertY = orientation[3+yIndex] == '+'
    let invertZ = orientation[3+zIndex] == '+'
    return [invertX ? xDim - loc[xIndex] : loc[xIndex], invertY ? yDim - loc[yIndex] : loc[yIndex], invertZ ? zDim - loc[zIndex] : loc[zIndex]]
}

let go_to_patient = (patient) => {
    if(!patient['location_voxel']) {
        return
    }
    let loc = patient_location_to_voxel_coordinates(patient['location_voxel'])
    console.log(loc)
    go_to_voxel_coordinates(loc)
    // loc = patient['location']
    // go_to_world_coordinates([loc[0], loc[1], loc[2]])
}

let capitalize_first_letter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

let load_patient = (i) => {
    // compute current patient duration

    let patient = patients[current_patient_index]
    if(patient != null) {
        if(patient.duration == null) {
            patient.duration = 0
        }
        patient.duration += Date.now() - patient.start_time
        console.log('patient duration:', patient.duration)
    }

    current_patient_index = i;
    if (current_patient_index < 0) {
        current_patient_index = patients.length - 1;
    }
    if (current_patient_index >= patients.length) {
        current_patient_index = 0;
    }

    patient = patients[current_patient_index]

    let answer_input = document.getElementById('answer')
    answer_input.value = patient.answer || ''
    patient.start_time = Date.now()

    let image_descriptions = patient['images']

    let image_parameters = []

    let need_to_load = false

    for (let image_description of image_descriptions) {
        if (loaded_images.length == 0 || loaded_images.findIndex((i) => i.file_name.split('/').at(-1) == image_description.file) < 0) {
            need_to_load = true;
            break
        }
    }

    // let description = document.getElementById('description')

    if (!need_to_load) {
        go_to_patient(patient)
        // description.innerText = `${patient['name']} - ${current_patient_index + 1}/${patients.length}`
        return
    }

    // if(image_descriptions.length < 8) {
    //     image_descriptions.push(image_descriptions[image_descriptions.length-1])
    // }


    // description.innerText = 'loading ' + patient['name'] + '...'
    
    let visibility_checkboxes = document.getElementById('toggle-visibility-buttons')
    visibility_checkboxes.replaceChildren();

    show_loader()
    let image_names = []
    let ni = 0
    for (let image_description of image_descriptions) {
        if (ni>=11) {
            break
        }
        ni++
        
        let file_name = archive != null ? Object.keys(archive.files).find((f) => f == image_description.file) : image_description.file

        image_names.push(file_name)
        image_parameters.push({ name: image_description.name, file_name: file_name, parameters: image_description.parameters, display: image_description.display })
    }

    if(image_files != null && archive == null) {
        images_to_display = image_names.map((file_name) => { return [...image_files].find((f) => f.name == file_name) })
        // for all images_to_display which have a size of 0: remove them from images_to_display and image_parameters
        images_to_display = images_to_display.filter((image) => image.size != 0)
        image_parameters = image_parameters.filter((parameter) => images_to_display.findIndex((file) => file.name == parameter.file_name) >= 0)
        load_patient_viewer(images_to_display, image_parameters, patient, current_patient_index)
        return
    }
    let promises = image_names.map((image_name) => { return archive.file(image_name).async('base64')} )
    Promise.all(promises).then((images) => load_patient_viewer(images, image_parameters, patient, current_patient_index))

    let patient_name = patient['name']

    archive.file(patient_name + '/report.pdf').async('blob').then((content)=> {
        let report = document.getElementById('report')
        report.src = URL.createObjectURL(content.slice(0, content.size, 'application/pdf'))
        report.classList.remove('hide')
    })

    archive.file(patient_name + '/clinical_case.txt').async('string').then((text)=> {
        let clinical_case = document.getElementById('clinical_case')
        clinical_case.innerText = text
    })
}

// let create_table = () => {
//     let rowData = []
//     let i = 0
//     for (let patient of patients) {
//         data = { name: patient.name, description: patient.description, comment: patient.comment, valid: patient.valid }

//         if (task.fields != null) {
//             for (let field of task.fields) {
//                 let field_name = field.field || field.name
//                 data[field_name] = patient[field_name]
//             }
//         }
//         rowData.push(data)

//     }

//     // specify the columns
//     let columnDefs = [
//         { field: 'name', sortable: true, filter: true, width: 150, resizable: true },
//         { field: 'description', sortable: true, filter: true, flex: true, resizable: true },
//         // { field: 'n_methods_which_detected_patient', sortable: true, resizable: true, filter: 'agNumberColumnFilter' },
//     ];

//     if (task.fields != null) {
//         for (let field of task.fields) {
//             if (field.field == null && field.name != null) { // retro compatibility
//                 field.field = field.name
//             }
            
//             if(field.editable && field.longiseg_type == 'bool') {
//                 field.cellRenderer = 'checkboxRenderer'
//             }
//             columnDefs.push(field)
//         }
//     }
//     columnDefs.push({ field: 'valid', sortable: true, filter: true, resizable: true, editable: true, cellRenderer: 'checkboxRenderer' })
//     columnDefs.push({ field: 'comment', sortable: true, filter: true, resizable: true, editable: true })

//     // let the grid know which columns and what data to use
//     const gridOptions = {
//         columnDefs: columnDefs,
//         rowSelection: 'single',
//         rowData: rowData,
//         onRowSelected: (event) => {
//             if (!event.node.isSelected()) {
//                 return
//             }
//             let patient_index = patients.findIndex((patient) => patient.name == event.data.name)
//             load_patient(patient_index)
//         },
//         components: { checkboxRenderer: CheckboxRenderer },
//         onCellValueChanged: (event)=> {
//             let field_name = event.colDef.field
//             let patient_index = patients.findIndex((patient) => patient.name == event.data.name)
//             let patient = patients[patient_index]
//             patient[field_name] = event.value
//             let element = document.getElementById(field_name + '_value')
//             if(patient_index == current_patient_index &&  element != null) {
//                 // could check element.tagName
//                 element.innerText = patient[field_name]
//                 element.value = patient[field_name]
//                 element.checked = patient[field_name]
//                 element.indeterminate = false
//             }
//             save_in_local_storage()
//         }
//         // columnTypes: { numberColumn: { width: 100, filter: 'agNumberColumnFilter' } }
//     };


//     if (grid != null) {
//         grid.destroy()
//     }
//     const eGridDiv = document.querySelector('#plot_div');

//     // create the grid passing in the div to use together with the columns & data we want to use
//     grid = new agGrid.Grid(eGridDiv, gridOptions);
//     grid.gridOptions.api.sizeColumnsToFit();

// }

let resize_viewer = (container) => {

    let papaya_containers = document.getElementById('papaya-containers')
    let papaya_container0 = document.getElementById('papaya-container0')
    let papaya_container1 = document.getElementById('papaya-container1')
    let viewer_ratio = 1.5

    let padding_height = papayaContainers.length > 0 ? papayaContainers[1].containerHtml.height() - papayaContainers[1].getViewerDimensions()[1] : 0
    
    if (container == null) {
        container = {}
        container.width = window.innerWidth - 250 - 16
        container.height = window.innerHeight - padding_height
    }

    let container_ratio = container.width / container.height
    
    // let side_by_side = !papaya_container0.classList.contains('hide')
    let side_by_side = true
    if(side_by_side) {


        if (container_ratio > viewer_ratio) {

            if (container_ratio > 2 * viewer_ratio) {
                // Very horizontal
                papaya_container0.style.height = '' + (container.height) + 'px'
                papaya_container0.style.width = '' + (container.height * viewer_ratio) + 'px'
                papaya_container0.style['margin-bottom'] = '' + padding_height + 'px'
                papaya_container1.style.height = '' + (container.height)+ 'px'
                papaya_container1.style.width = '' + (container.height * viewer_ratio) + 'px'
                papaya_container1.style['margin-bottom'] = '' + padding_height + 'px'
                papaya_containers.classList.replace('column', 'row')
            } else {
                // Horizontal
                papaya_container0.style.width = '' + (container.width / 2) + 'px'
                papaya_container0.style.height = '' + (0.5 * container.width / viewer_ratio) + 'px'
                papaya_container0.style['margin-bottom'] = '' + padding_height + 'px'
                papaya_container1.style.width = '' + (container.width / 2) + 'px'
                papaya_container1.style.height = '' + (0.5 * container.width / viewer_ratio) + 'px'
                papaya_container1.style['margin-bottom'] = '' + padding_height + 'px'
                papaya_containers.classList.replace('column', 'row')
            }
    
        } else {

            container.height -= padding_height
            container_ratio = container.width / container.height
    
            if (container_ratio < viewer_ratio / 2) {
                // Very vertical
                papaya_container0.style.width = '' + (container.width) + 'px'
                papaya_container0.style.height = '' + (container.width / viewer_ratio) + 'px'
                papaya_container0.style['margin-bottom'] = '' + padding_height + 'px'
                papaya_container1.style.width = '' + (container.width) + 'px'
                papaya_container1.style.height = '' + ( container.width / viewer_ratio) + 'px'
                papaya_container1.style['margin-bottom'] = '' + padding_height + 'px'
                papaya_containers.classList.replace('row', 'column')
            } else {
                // Vertical
                papaya_container0.style.height = '' + (container.height / 2) + 'px'
                papaya_container0.style.width = '' + (container.height * viewer_ratio/2) + 'px'
                papaya_container0.style['margin-bottom'] = '' + padding_height + 'px'
                papaya_container1.style.height = '' + (container.height / 2) + 'px'
                papaya_container1.style.width = '' + (container.height * viewer_ratio/2) + 'px'
                papaya_container1.style['margin-bottom'] = '' + padding_height + 'px'
                papaya_containers.classList.replace('row', 'column')
            }
        }
    } else {
        
        if (container_ratio > viewer_ratio) {
            papaya_container1.style.height = '' + (container.height) + 'px'
            papaya_container1.style.width = '' + (container.height * viewer_ratio) + 'px'
        } else {
            papaya_container1.style.width = '' + (container.width) + 'px'
            papaya_container1.style.height = '' + (container.width / viewer_ratio) + 'px'
        }
        papaya_container1.style['margin-bottom'] = '' + padding_height + 'px'
    }
    setTimeout(() => papaya.Container.resizePapaya(), 250)
}
// resize_viewer({innerWidth: 400, innerHeight: 400})
window.addEventListener('resize', function (event) {
    resize_viewer()
})

let load_patients = (p) => {
    patients = p
    if (patients.length > 0) {
        load_from_local_storage()
        let viewer_container = document.getElementById('viewer-container')
        viewer_container.classList.remove('hide')
        // create_table()
        load_patient(0)
        resize_viewer()
        // grid.gridOptions.api.selectIndex(0)
    } else {
        console.log('no patients found')
    }
}

let load_task = (file) => {
    let task_json = JSON.parse(file)
    task = task_json
    load_patients(task_json.patients)
}

// function CheckboxRenderer() { }

// CheckboxRenderer.prototype.init = function (params) {
//     this.params = params;

//     this.eGui = document.createElement('input');
//     this.eGui.type = 'checkbox';
//     this.eGui.checked = params.value;

//     this.checkedHandler = this.checkedHandler.bind(this);
//     this.eGui.addEventListener('click', this.checkedHandler);
// }

// CheckboxRenderer.prototype.checkedHandler = function (e) {
//     let checked = e.target.checked;
//     let colId = this.params.column.colId;
//     this.params.node.setDataValue(colId, checked);
//     // let patient_index = patients.findIndex((patient) => patient.name == this.params.data.name)
//     // let patient = patients[patient_index]
//     // patient[colId] = checked
//     // save_in_local_storage()
//     // let checkbox_element = document.getElementById(colId + '_value')
//     // checkbox_element.value = checked
//     // checkbox_element.indeterminate = false
//     // checkbox_element.innerText = checked
// }

// CheckboxRenderer.prototype.getGui = function (params) {
//     return this.eGui;
// }

// CheckboxRenderer.prototype.destroy = function (params) {
//     this.eGui.removeEventListener('click', this.checkedHandler);
// }

let save_in_local_storage = ()=> {
    if(patients == null) {
        return
    }
    let patients_string = JSON.stringify(patients)
    localStorage.setItem(task != null && task.name ? task.name : 'patients', patients_string)
}

let load_from_local_storage = ()=> {
    let patients_string = localStorage.getItem(task != null && task.name ? task.name : 'patients')
    if(patients_string != null && patients_string.length > 0) {
        let stored_patients = JSON.parse(patients_string)
        // if stored patients are not the same as the current patients, overwrite the current patients
        if(stored_patients.length != patients.length) {
            alert('The stored patients are not the same as the patients in the file!')
            return
        }
        patients = stored_patients
        // let stored_patient_found = stored_patients.findIndex((sl)=> patients.findIndex((l)=> l.name == sl.name) >= 0) >= 0
        // if(stored_patient_found) {
        //     for(let patient of patients) {         
        //         let stored_patient_index = stored_patients.findIndex((l)=> l.name == patient.name)
        //         if(stored_patient_index < 0 || stored_patient_index >= stored_patients.length) {
        //             continue
        //         }
        //         let stored_patient = stored_patients[stored_patient_index]
        //         if (task.fields != null) {
        //             for (let field of task.fields) {
        //                 let field_name = field.field || field.name
        //                 if(field.editable) {
        //                     patient[field_name] = stored_patient[field_name]
        //                 }
        //             }
        //         }
        //         patient.comment = stored_patient.comment
        //         patient.valid = stored_patient.valid
        //     }
        // }
    }
}

// let set_data_selected_row = (field_name, value)=> {
//     let selected_nodes = grid.gridOptions.api.getSelectedNodes()
//     if(selected_nodes.length > 0) {
//         let selected_node = selected_nodes[0]
//         selected_node.setDataValue(field_name, value)
//     }
// }

let toggle_crosshairs = () => {
    for(let i=0 ; i<2 ; i++) {
        papayaContainers[i].preferences.showCrosshairs = papayaContainers[i].preferences.showCrosshairs == 'Yes' ? 'No' : 'Yes'
        papayaContainers[i].viewer.drawViewer()
    }
}

document.addEventListener('DOMContentLoaded', function (event) {
    let papaya_container0 = document.getElementById('papaya-container0')

    // let side_by_side = localStorage.getItem('side-by-side')
    // if (side_by_side == 'true') {
    //     papaya_container0.classList.remove('hide')
    // } else {
    //     papaya_container0.classList.add('hide')
    // }

    resize_viewer()

    for(let i=0 ; i<2 ; i++) {
        let papaya_container = document.getElementById('papaya-container' + i)
        papaya_container.addEventListener('wheel', (event) => {
            event.preventDefault()
        })
    }
    
    // let side_by_side_button = document.getElementById('side-by-side')
    // side_by_side_button.addEventListener('click', () => {
    //     if(papaya_container0.classList.contains('hide')) {
    //         papaya_container0.classList.remove('hide')
    //     } else {
    //         papaya_container0.classList.add('hide')
    //     }
    //     localStorage.setItem('side-by-side', !papaya_container0.classList.contains('hide'))
    //     resize_viewer()
    // })

    // let load_patients_data = document.getElementById('load_patients_data')
    // load_patients_data.onchange = function () {
    //     let file = this.files[0]
    //     const objectURL = URL.createObjectURL(file)
    //     dfd.read_csv(objectURL).then((df)=> {
    //         load_patients(df.to_json({ download: false }))
    //     }).catch(err => {
    //         console.log(err)
    //     })
    // }

    // let load_task_description = document.getElementById('load_task_description')
    // load_task_description.onchange = function () {
    //     if (this.files.length == 0) {
    //         return
    //     }
    //     let file = this.files[0]
    //     let file_reader = new FileReader();
    //     file_reader.onload = (event) => load_task(event.target.result)
    //     file_reader.readAsText(file, 'UTF-8')
    // }

    let load_archive = document.getElementById('load_archive')

    load_archive.onchange = function () {
        // hide #load_buttons
        let load_buttons = document.getElementById('load_buttons')
        load_buttons.classList.add('hide')
        if (this.files.length == 0) {
            return
        }
        var zip = new JSZip();
        zip.loadAsync(this.files[0] /* = file blob */)
            .then(function (local_zip) {
                archive = local_zip;
                for (let file in archive.files) {
                    if (file.endsWith('.json')) {
                        return archive.file(file).async('text')
                    }
                }

            }).then(function (result) {
                if (result) {
                    load_task(result)
                } else {
                    console.log('task.json not found')
                }
            })
    };

    // on #answer input change: change patients and save it in local storage
    let answer_input = document.getElementById('answer')
    answer_input.onchange = function () {
        if (this.value.length == 0) {
            return
        }
        let answer = this.value
        let patient = patients[current_patient_index]
        patient.answer = answer
        save_in_local_storage()
    }
    


    // let load_files = document.getElementById('load_files')

    // load_files.onchange = function () {
    //     if (this.files.length == 0) {
    //         return
    //     }
    //     image_files = this.files
    // };

    // let comment = document.getElementById('comment_value');
    // comment.addEventListener('change', () => {
    //     let patient = patients[current_patient_index]
    //     patient.comment = comment.value
    //     set_data_selected_row('comment', patient.comment)
    // })

    // let valid = document.getElementById('valid_value');
    // valid.addEventListener('change', () => {
    //     let patient = patients[current_patient_index]
    //     patient.valid = valid.checked
    //     set_data_selected_row('valid', patient.valid)
    // })

    let save = document.getElementById('save');
    save.addEventListener('click', () => {
        task.patients = patients
        let patients_string = JSON.stringify(task, null, '\t')

        var data_string = 'data:text/json;charset=utf-8,' + encodeURIComponent(patients_string);
        var download_node = document.createElement('a');
        download_node.setAttribute('href', data_string);
        download_node.setAttribute('download', 'patients.json');
        document.body.appendChild(download_node); // required for firefox
        download_node.click();
        download_node.remove();
    })

    let prev_button = document.getElementById('prev')
    prev_button.addEventListener('click', () => {
        // let selected_nodes = grid.gridOptions.api.getSelectedNodes()
        // let current_row = selected_nodes.length > 0 && selected_nodes[0].displayed ? selected_nodes[0].rowIndex - 1 : 1
        // if (current_row < 0) {
        //     current_row = grid.gridOptions.api.getDisplayedRowCount() - 1;
        // }
        // grid.gridOptions.api.selectIndex(current_row)
        if(current_patient_index > 0) {
            load_patient(current_patient_index - 1)
            if(current_patient_index == 0) {
                prev_button.disabled = true
            }
        }
    })

    let next_button = document.getElementById('next')
    next_button.addEventListener('click', () => {
        // let selected_nodes = grid.gridOptions.api.getSelectedNodes()
        // let current_row = selected_nodes.length > 0 && selected_nodes[0].displayed ? grid.gridOptions.api.getSelectedNodes()[0].rowIndex + 1 : -1
        // if (current_row >= grid.gridOptions.api.getDisplayedRowCount()) {
        //     current_row = 0;
        // }
        // grid.gridOptions.api.selectIndex(current_row)
        if(current_patient_index < patients.length - 1) {
            load_patient(current_patient_index + 1)
            if(current_patient_index == patients.length - 1) {
                next_button.disabled = true
            }
        }
    })

    // let go_to_patient_button = document.getElementById('go-to-patient')
    // go_to_patient_button.addEventListener('click', () => {
    //     go_to_patient(patients[current_patient_index])
    // })

    // let toggle_crosshairs_button = document.getElementById('toggle-crosshairs')
    // toggle_crosshairs_button.addEventListener('click', toggle_crosshairs)
});

// // Draw test

// const downloadURL = (data, fileName) => {
//     const a = document.createElement('a')
//     a.href = data
//     a.download = fileName
//     document.body.appendChild(a)
//     a.style.display = 'none'
//     a.click()
//     a.remove()
// }

// const downloadBlob = (data, fileName, mimeType) => {

//     const blob = new Blob([data], {
//         type: mimeType
//     })

//     const url = window.URL.createObjectURL(blob)

//     downloadURL(url, fileName)

//     setTimeout(() => window.URL.revokeObjectURL(url), 1000)
// }

// // data = papayaContainers[0].viewer.screenVolumes[4].volume.imageData.data
// // downloadBlob(data, 'test.bin', 'application/octet-stream');

// let write_test_volume = (data) => {
//     for (let i = 0; i < data.length; i++) {
//         data[i] = i % 255
//     }
// }

// // write_test_volume(data)
// // let canvas = papayaContainers[0].viewer.canvas
// // canvas.addEventListener('mousemove', this.listenerMouseMove, false);
// // canvas.addEventListener('mousedown', this.listenerMouseDown, false);
// // // canvas.addEventListener('mouseout', this.listenerMouseOut, false);
// // // canvas.addEventListener('mouseleave', this.listenerMouseLeave, false);
// // canvas.addEventListener('mouseup', this.listenerMouseUp, false);

let toggle_image = (n)=> {
    if(n < 0 || n >= loaded_images.length) {
        return
    }
    checkbox_id = 'checkbox_' + loaded_images[n].display_name
    checkbox = document.getElementById(checkbox_id)
    if(checkbox) {
        checkbox.click()
    }
}

document.addEventListener('keyup', (event)=> {
    let n = parseInt(event.key)
    if(Number.isInteger(n)) {
        toggle_image(n)
    }
    if(event.key == '*') {
        toggle_image(loaded_images.length-1)
    }
    if(event.key == '-') {
        while(current_image_index > 0 && papayaContainers[1].viewer.screenVolumes[current_image_index].hidden) {
            current_image_index--
        }
        toggle_image(current_image_index)
    }
    if(event.key == '+') {
        while(current_image_index < loaded_images.length-1 && !papayaContainers[1].viewer.screenVolumes[current_image_index].hidden) {
            current_image_index++
        }
        toggle_image(current_image_index)
    }
    if(event.key == 'c') {
        toggle_crosshairs()
    }
})