const {Adw,Gio,Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Config = imports.misc.config;
const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');

function init(){}

function fillPreferencesWindow(window){
	window.default_height = 950;

//panel page:
	let page = addPreferencesPage(window,'Panel','computer-symbolic');

	let group = addGroup(page,'Icon');
	let showIconDropDown = addDropDown(group,'show-icon','Show source icon',{'off':'','left':'left','right':'right'},undefined);
	addSpinButton(group, 'icon-padding', 'Icon padding', 0, 50, undefined);
	addSwitch(group, 'symbolic-source-icon', 'Use symbolic source icon', "Uses an icon that follows the shell's color scheme");
	addSwitch(group,'use-album','Use album art as icon when available',undefined);
	addSpinButton(group,'album-size','Album art scaling (in %)',20,250,undefined);

	group = addGroup(page,'Position');
	let extensionPlaceDropDown = addDropDown(group,'extension-place','Extension place',{'left':'left','center':'center','right':'right'},undefined);
	addSpinButton(group,'extension-index','Extension index',0,20,"Set widget location within with respect to other adjacent widgets");
	addSpinButton(group,'left-padding','Left padding',0,500,undefined);
	addSpinButton(group,'right-padding','Right padding',0,500,undefined);

	group = addGroup(page,'Wrong index at loadup mitigations');
	addSpinButton(group,'reposition-delay','Panel reposition at startup (delay in seconds)',0,300,"Increase this value if extension index isn't respected at startup");
	addSwitch(group,'reposition-on-button-press','Update panel position on every button press',undefined);

	addResetButton(group,'Reset Panel settings',[
		'show-icon','left-padding','right-padding','extension-index','extension-place','reposition-delay','reposition-on-button-press','use-album',
		'album-size','symbolic-source-icon','icon-padding'],
		[showIconDropDown,extensionPlaceDropDown]
	);

//label page:
	page = addPreferencesPage(window,'Label','document-edit-symbolic');

	group = addGroup(page,'Behaviour');
	addSwitch(group,'auto-switch-to-most-recent','Switch to the most recent source automatically',"This option can be annoying without the use of filter lists");
	addSwitch(group,'remove-text-when-paused','Hide when paused',undefined);
	addSpinButton(group,'remove-text-paused-delay','Hide when paused delay (seconds)',0,9999,undefined);
	addSpinButton(group,'refresh-rate','Refresh rate (milliseconds)',30,3000,undefined);
	addEntry(group,'label-filtered-list','Filter segments containing',"Separate entries with commas, special characters will be removed\n\nThe targeted segments are defined in code as:\n\t\A substring enclosed by parentheses, square brackets,\n\t or between the end of the string and a hyphen");

	group = addGroup(page,'Appearance');
	addSpinButton(group,'max-string-length','Max string length (each field)',1,150,undefined);
	addEntry(group,'button-placeholder','Button placeholder',"The button placeholder is a hint for the user and can be left empty.\n\nIt appears when the label is empty and another available source is active");
	addEntry(group,'divider-string','Divider string (you can use spaces)',undefined);

	let fieldOptions1 = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title'};
	let fieldOptions2 = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title','none':''};
	let fieldOptions3 = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title','none':''};
	let [firstFieldDropDown, secondFieldDropDown, lastFieldDropDown] = addTripleStringDropDown(group,'first-field','second-field','last-field','Visible fields and order',fieldOptions1,fieldOptions2,fieldOptions3,undefined);

	addResetButton(group,'Reset Label settings',[
		'max-string-length','refresh-rate','button-placeholder','label-filtered-list','divider-string','first-field','second-field',
		'last-field','remove-text-when-paused','remove-text-paused-delay','auto-switch-to-most-recent']
	);

//filters page:
	page = addPreferencesPage(window,'Filters','dialog-error-symbolic');

	group = addGroup(page,'List of available MPRIS Sources');
	let sourcesListEntry = addWideEntry(group,undefined,'',"Press the button below to update");
	sourcesListEntry.set_text(playersToString());
	sourcesListEntry.set_editable(false);

	let updateButton = addButton(group,'Update list of available MPRIS sources', () => {
		sourcesListEntry.set_text(playersToString());
	});
	updateButton.set_margin_top(10);

	group = addGroup(page,'Ignore list');
	addWideEntry(group,'mpris-sources-blacklist','Separate entries with commas',undefined);

	group = addGroup(page,'Allow list');
	addSwitch(group,'use-whitelisted-sources-only','Ignore all sources except allowed ones',"This option is ignored if the allow list is empty");
	let allowListEntry = addWideEntry(group,'mpris-sources-whitelist','Separate entries with commas',undefined);
	allowListEntry.set_margin_top(10);

	group = addGroup(page,'Players excluded from using album art as icon');
	addWideEntry(group,'album-blacklist','Separate entries with commas',undefined);

	addResetButton(group,'Reset Filters settings',[
		'mpris-sources-blacklist','mpris-sources-whitelist','use-whitelisted-sources-only','album-blacklist']
	);

//controls page:
	page = addPreferencesPage(window,'Controls','input-mouse-symbolic');

	let buttonActions = {
		'open menu':'open-menu','play/pause':'play-pause','next track':'next-track','previous track':'prev-track','next player':'next-player',
		'open app':'activate-player','volume mute':'volume-mute','volume up':'volume-up','volume down':'volume-down','none':'none'
	};

	group = addGroup(page,'Double Click');
	addSwitch(group, 'enable-double-clicks', 'Enable double clicks', undefined);
	let doubleClickTime = addSpinButton(group, 'double-click-time', 'Double click time (milliseconds)', 1, 1000, undefined);

	group = addGroup(page,'Mouse bindings');

	row = new Adw.ActionRow({ title: ''});
	let singleClickLabel = new Gtk.Label({ //not sure how to underline or reduce height
		label: 'Single click',
		width_chars: 17
	});
	row.add_suffix(singleClickLabel);
	doubleClickLabel = new Gtk.Label({
		label: 'Double click',
		width_chars: 17
	});
	row.add_suffix(doubleClickLabel);
	group.add(row);

	let [leftClickDropDown, leftDoubleClickDropDown] = addDoubleStringDropDown(group,'left-click-action','left-double-click-action','Left click',buttonActions,undefined);
	let [middleClickDropDown, middleDoubleClickDropDown] = addDoubleStringDropDown(group,'middle-click-action','middle-double-click-action','Middle click',buttonActions,undefined,);
	let [rightClickDropDown, rightDoubleClickDropDown] = addDoubleStringDropDown(group,'right-click-action','right-double-click-action','Right click',buttonActions,undefined);
	let [thumbForwardDropDown, thumbDoubleForwardDropDown] = addDoubleStringDropDown(group,'thumb-forward-action','thumb-double-forward-action','Thumb-tip button',buttonActions,undefined);
	let [thumbBackwardDropDown, thumbDoubleBackwardDropDown] = addDoubleStringDropDown(group,'thumb-backward-action','thumb-double-backward-action','Inner-thumb button',buttonActions,undefined);

	group = addGroup(page,'');
	let scrollDropDown = addDropDown(group,'scroll-action','Scroll up/down',{'volume control':'volume-controls','none':'none'},undefined);
	scrollDropDown.set_size_request(140,-1); //match size with next button

	group = addGroup(page,'Behaviour');
	let VolumeControlDropDown = addDropDown(group,'volume-control-scheme','Volume control scheme',{'application':'application','global':'global'},undefined);
	VolumeControlDropDown.set_size_request(140,-1); //match size with previous button

	addResetButton(group,'Reset Controls settings',[
		'enable-double-clicks','double-click-time','left-click-action','left-double-click-action','middle-click-action','middle-double-click-action',
		'right-click-action','right-double-click-action','scroll-action','thumb-forward-action','thumb-double-forward-action','thumb-backward-action',
		'thumb-double-backward-action','volume-control-scheme']
	);

	[doubleClickTime, doubleClickLabel, leftDoubleClickDropDown, middleDoubleClickDropDown, rightDoubleClickDropDown, thumbDoubleForwardDropDown, thumbDoubleBackwardDropDown]
		.forEach(el => bindEnabled(settings, 'enable-double-clicks', el));
}

// Adwaita "design" and "structure" functions

function addPreferencesPage(window,name,icon){
	let thisPage = new Adw.PreferencesPage({
		name: name,
		title: name,
		icon_name: icon,
	});
	window.add(thisPage);
	return thisPage;
}

function addGroup(page,title){
	let thisGroup = new Adw.PreferencesGroup({ title: title});
	page.add(thisGroup);
	return thisGroup;
}

// Adwaita 'Row' functions, they add a row to the target group with the widget(s) specified

function addSpinButton(group,setting,labelstring,lower,upper,labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	let resetButton = buildResetButton(setting);

	let thisSpinButton = new Gtk.SpinButton({
		adjustment: new Gtk.Adjustment({
			lower: lower,
			upper: upper,
			step_increment: 1
		}),
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		visible: true
	});
	settings.bind(setting,thisSpinButton,'value',Gio.SettingsBindFlags.DEFAULT);

	row.add_suffix(resetButton);
	row.add_suffix(thisSpinButton);

	thisSpinButton.connect('changed',() => {resetButton.set_visible(true)})

	group.add(row);
	return row;
}

function addDropDown(group,setting,labelstring,options,labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);
	let width = 105;

	let thisComboRow = buildDropDown(settings,setting,options,width)

	let thisResetButton = buildDropDownResetButton([setting],[thisComboRow],[options])

	thisComboRow.connect('notify::selected-item', () => {
		settings.set_string(setting,Object.values(options)[thisComboRow.get_selected()]);
		thisResetButton.set_visible(true);
	});

	//label for debugging
	let thisLabel = new Gtk.Label({
		label: 'default: '+thisComboRow._defaultValueIndex.toString()
	})
	row.add_suffix(thisLabel);

	row.add_suffix(thisResetButton);
	row.add_suffix(thisComboRow);

	group.add(row);

	return thisComboRow;
}

function addDoubleStringDropDown(group, setting1, setting2, labelstring, options, labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);
	let width = 135;

	let comboBox1 = buildDropDown(settings, setting1, options, width);
	let comboBox2 = buildDropDown(settings, setting2, options, width);
	let thisResetButton = buildDropDownResetButton([setting1,setting2],[comboBox1,comboBox2],[options,options])

	comboBox1.connect('notify::selected-item', () => {
		settings.set_string(setting1,Object.values(options)[comboBox1.get_selected()]);
		thisResetButton.set_visible(true);
	});

	comboBox2.connect('notify::selected-item', () => {
		settings.set_string(setting2,Object.values(options)[comboBox2.get_selected()]);
		thisResetButton.set_visible(true);
	});

	row.add_suffix(thisResetButton);
	row.add_suffix(comboBox1);
	row.add_suffix(comboBox2);

	group.add(row)

	return [comboBox1, comboBox2]
}

function addTripleStringDropDown(group, setting1, setting2, setting3, labelstring, options1, options2, options3, labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);
	let width = 81;

	let comboBox1 = buildDropDown(settings, setting1, options1,width);
	let comboBox2 = buildDropDown(settings, setting2, options2,width);
	let comboBox3 = buildDropDown(settings, setting3, options3,width);
	let thisResetButton = buildDropDownResetButton([setting1,setting2,setting3],[comboBox1,comboBox2,comboBox3],[options1,options2,options3])

	comboBox1.connect('notify::selected-item', () => {
		settings.set_string(setting1,Object.values(options1)[comboBox1.get_selected()]);
		thisResetButton.set_visible(true);
	});

	comboBox2.connect('notify::selected-item', () => {
		settings.set_string(setting2,Object.values(options2)[comboBox2.get_selected()]);
		thisResetButton.set_visible(true);
	});

	comboBox3.connect('notify::selected-item', () => {
		settings.set_string(setting3,Object.values(options3)[comboBox3.get_selected()]);
		thisResetButton.set_visible(true);
	});

	row.add_suffix(thisResetButton);
	row.add_suffix(comboBox1);
	row.add_suffix(comboBox2);
	row.add_suffix(comboBox3);

	group.add(row)
	return [comboBox1, comboBox2, comboBox3]
}

function addSwitch(group,setting,labelstring,labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	let resetButton = buildResetButton(setting);
	row.add_suffix(resetButton);

	let thisSwitch = new Gtk.Switch({
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		visible: true
	});
	settings.bind(setting,thisSwitch,'active',Gio.SettingsBindFlags.DEFAULT);
	row.add_suffix(thisSwitch);

	thisSwitch.connect('state-set',() => {
		if (settings.get_boolean(setting) == Boolean(settings.get_default_value(setting)))
			resetButton.set_visible(false);
		else 
			resetButton.set_visible(true)
	})

	group.add(row)
}

function addEntry(group,setting,labelstring,labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	let resetButton = buildResetButton(setting);
	row.add_suffix(resetButton);

	let thisEntry = new Gtk.Entry({
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		width_request: 200,
		visible: true
	});
	settings.bind(setting,thisEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	row.add_suffix(thisEntry);

	thisEntry.connect('changed',() => {resetButton.set_visible(true)})

	group.add(row)
}

function addWideEntry(group,setting,placeholder,labeltooltip){
	let thisEntry = new Gtk.Entry({ 
		visible: true,
		secondary_icon_name: '',
		secondary_icon_tooltip_text: "Reset to Default"
	});
	if ( labeltooltip )
		thisEntry.set_tooltip_text(labeltooltip)

	if (setting){
		settings.bind(setting,thisEntry,'text',Gio.SettingsBindFlags.DEFAULT);
		thisEntry.connect('icon-press',() => {
			thisEntry.set_icon_from_icon_name(1,'');
			settings.reset(setting)
		});

		thisEntry.connect('changed',() => {	thisEntry.set_icon_from_icon_name(1,'edit-clear-symbolic');	})

		if (settings.get_string(setting))
			thisEntry.set_icon_from_icon_name(1,'edit-clear-symbolic');
	}

	thisEntry.set_placeholder_text(placeholder);
	group.add(thisEntry);

	return thisEntry;
}

function addResetButton(group,labelstring,options,dropDowns){
	let thisButton = buildButton(labelstring, () => {
		options.forEach(option => {
			settings.reset(option);
		});
	});

	if (dropDowns){
		dropDowns.forEach(dropDown => {
			dropDown.set_selected(dropDown._defaultValueIndex);
		});
	}

	group.add(thisButton);

	return thisButton;
}

function addButton(group,labelstring,callback){
	let thisButton = buildButton(labelstring,callback);
	group.add(thisButton);
	return thisButton;
}

// 'build' functions, they build "generic" widgets of the specified type and returns it

function buildActionRow(labelstring,labeltooltip){
	let row = new Adw.ActionRow({ title: labelstring });
	if ( labeltooltip ){
		if (labeltooltip.length>70){ //could make every tooltip a button if preferred
			let thisInfoButton = buildInfoButton(labeltooltip);
			row.add_suffix(thisInfoButton);
		}
		else
			row.subtitle = labeltooltip;
	}

	return row;
}

function buildInfoButton(labeltooltip){
	let thisInfoButton = new Gtk.MenuButton({
		valign: Gtk.Align.CENTER,
		icon_name: 'info-symbolic',
		visible: true
	});
	thisInfoButton.add_css_class('flat');
	// thisInfoButton.add_css_class('circular');
	let thisPopover = new Gtk.Popover();
	let thisLabel = new Gtk.Label({
		label: labeltooltip
	});
	thisPopover.set_child(thisLabel);
	thisInfoButton.set_popover(thisPopover);

	return thisInfoButton;
}

function buildResetButton(setting){
	let thisResetButton = new Gtk.Button({
		valign: Gtk.Align.CENTER,
		icon_name: 'edit-clear-symbolic-rtl',
		visible: false
	});

	//hide if default setting
	if (settings.get_user_value(setting) != null)
		thisResetButton.set_visible(true)

	thisResetButton.add_css_class('flat');
	thisResetButton.set_tooltip_text('Reset to Default');

	thisResetButton.connect('clicked',() => {
		settings.reset(setting);
		thisResetButton.set_visible(false)
	});

	return thisResetButton;
}

function buildDropDown(settings,setting,options,width){
	let thisDropDown = new Gtk.DropDown({
		model: Gtk.StringList.new(Object.keys(options)),
		selected: Object.values(options).indexOf(settings.get_string(setting)),
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END
	});

	thisDropDown._defaultValueIndex = Object.values(options).indexOf(settings.get_default_value(setting).get_string()[0]);

	if (width)
		thisDropDown.set_size_request(width,-1);

	return thisDropDown;
}

function buildDropDownResetButton(setting,combobox,options){
	let thisResetButton = new Gtk.Button({
		valign: Gtk.Align.CENTER,
		icon_name: 'edit-clear-symbolic-rtl',
		visible: false
	});

	//hide if default setting
	setting.forEach((item) => {
		if (settings.get_user_value(item) != null && settings.get_user_value(item) != settings.get_default_value(item))
			thisResetButton.set_visible(true);
	})

	thisResetButton.add_css_class('flat');
	thisResetButton.set_tooltip_text('Reset to Default');

	thisResetButton.connect('clicked',() => {
		 for (let i = 0; i < setting.length; i++) {
			settings.reset(setting[i]);
			combobox[i].set_selected(Object.values(options[i]).indexOf(settings.get_string(setting[i])));
		}
		thisResetButton.set_visible(false);
	});

	return thisResetButton;
}

function buildButton(labelstring,callback){
	let button = new Gtk.Button({
		label: labelstring,
		margin_top: 30,
		visible: true
	});
	button.connect('clicked',callback);

	return button;
}

// helper functions

function bindEnabled(settings, setting, element) {
	settings.bind(setting, element, 'visible', Gio.SettingsBindFlags.GET);
}

// specific job/usage functions

function playersToString(){
	const dBusInterface = `
		<node>
			<interface name="org.freedesktop.DBus">
				<method name="ListNames">
					<arg direction="out" type="as"/>
				</method>
			</interface>
		</node>`

		const entryInterface = `
		<node>
			<interface name="org.mpris.MediaPlayer2">
				<property name="Identity" type="s" access="read"/>
			</interface>
		</node>`
		
	const dBusProxyWrapper = Gio.DBusProxy.makeProxyWrapper(dBusInterface);
	const dBusProxy = dBusProxyWrapper(Gio.DBus.session,'org.freedesktop.DBus','/org/freedesktop/DBus');

	let list = dBusProxy.ListNamesSync()[0];
	list = list.filter(element => element.startsWith('org.mpris.MediaPlayer2'));

	let entryWrapper = Gio.DBusProxy.makeProxyWrapper(entryInterface);

	let newList = [];
	list.forEach(element => {
		entryProxy = entryWrapper(Gio.DBus.session,element,"/org/mpris/MediaPlayer2");
		let identity = entryProxy.Identity;
		newList.push(identity);
	});

	return newList.toString()
}

