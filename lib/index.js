const Canvas = require('canvas');
const abbreviate = require('number-abbreviate');
const accents = require('accents');
const path = require('path');

const STATUS_COLOURS = {
	online: '#43b581',
	idle: 'faa61a',
	dnd: '#f04747',
	offline: '#747f8e',
	streaming: '#593595',
};

const shorten = (text, len) => {
	if (text.length <= len) return text;
	return `${text.substr(0, len).trim()}...`;
};

/**
 * A rank card, as used by Ayano!
 * @class
 * @public
 */
class RankCard {
	/**
	 * Fonts provided when building to customise rank cards.
	 * @typedef {Object} BuildFonts
	 * @property {string} bold The font to use for bold text
	 * @property {string} regular The font to use for regular text
	 */

	/**
	 * A font to register with Canvas for usage during building.
	 * @typedef {Object} Font
	 * @property {string} path The path to the font file
	 * @property {string} family The name of the font family to register it under
	 * @property {string} [weight] The weight of the font
	 * @property {string} [style] The style of the font
	 */

	/**
	 * Input to generate the Rank Card with.
	 * @typedef {Object} InputData
	 * @property {number} level The level of the user the rank card is being generated for
	 * @property {XPForLevel} xpForLevel A function that calculates the amount of XP per level
	 * @property {GuildMember} user The user to generate the rank card for
	 * @property {number} [rank] The rank of the user
	 * @property {Font[]} [fonts] The fonts to register for usage during building
	 * @property {number} [usernameLength] The length to shorten the username to
	 * @property {boolean} [stripAccents] Whether accents should be stripped from the username or not
	 */

	/**
	 * Internal type to represent part of a full piece of data.
	 * @typedef {Object} PartialPiece
	 * @property {T} data The piece of data
	 * @property {string} colour The colour to render the data with
	 * @property {number} size The font size in pixels to render the data at
	 * @template T
	 */

	/**
	 * Internal type to represent a piece of data.
	 * @typedef {PartialPiece<T>} Piece
	 * @property {boolean} display Whether the data should be displayed or not
	 * @property {string} displayText What to describe the data as on display
	 * @template T
	 */

	/**
	 * Supported background input types. This can be:
	 * * 'image'
	 * * 'colour'
	 * @typedef {string} BackgroundType
	 */

	/**
	 * Background data.
	 * @typedef {Object} Background
	 * @property {BackgroundType} type The type of the input. Can be one of 'image' or 'colour'
	 * @property {string | Buffer} value The inputted value. If 'image', Buffer. If 'colour', string.
	 */

	/**
	 * Supported progress bar colour input types. This can be:
	 * * 'gradient'
	 * * 'colour'
	 * @typedef {string} ProgressType
	 */

	/**
	 * Progress bar data.
	 * @typedef {Object} ProgressBar
	 * @property {boolean} rounded Whether or not the progress bar is rounded
	 * @property {string} trackColour The colour of the bar's track
	 * @property {Object} barColour
	 * @property {ProgressType} barColour.type The type of the input. Can be one of 'colour' or 'gradient'.
	 * @property {string | string[]} barColour.value The value of the input. If 'colour', string. If 'gradient', string[].
	 * @property {number} x The x coordinate
	 * @property {number} y The y coordinate
	 * @property {number} height The height in pixels
	 * @property {number} width The width in pixels
	 */

	/**
	 * Avatar data.
	 * @typedef {Object} Avatar
	 * @property {string | Buffer} source The source of the avatar
	 * @property {number} x The x coordinate
	 * @property {number} y The y coordinate
	 * @property {number} height The height in pixels
	 * @property {number} width The width in pixels
	 */

	/**
	 * Status data.
	 * @typedef {Object} Status
	 * @property {number} width The width of the object
	 * @property {PresenceStatus} type The status of the user
	 * @property {string} colour The colour of the status
	 * @property {boolean} circle Whether the status should display in a small circle rather than a ring
	 */

	/**
	 * Overlay data.
	 * @typedef {Object} Overlay
	 * @property {boolean} display Whether the overlay should be displayed
	 * @property {number} alpha The alpha value of the overlay
	 * @property {string} colour The colour of the overlay
	 */

	/**
	 * Internal data used by the builder to render cards.
	 * @typedef {Object} CardData
	 * @property {number} width The width of the card
	 * @property {number} height The height of the card
	 * @property {Background} background Data about the background of the card
	 * @property {ProgressBar} progressBar Data about the progress bar
	 * @property {Avatar} avatar Data about the avatar
	 * @property {Status} status Data about the status
	 * @property {Overlay} overlay Data about the overlay
	 * @property {Piece<number>} rank Data about the user's rank
	 * @property {Piece<number>} level Data about the user's level
	 * @property {PartialPiece<number>} currentXP Data about the user's current XP
	 * @property {PartialPiece<number>} requiredXP Data about the user's required XP
	 * @property {PartialPiece<string>} username Data about the user's username
	 * @property {PartialPiece<string>} discriminator Data about the user's discriminator
	 */

	/**
	 * Calculates the amount of XP for a level.
	 * @callback XPForLevel
	 * @param {number} level The level to calculate the amount of XP for
	 * @returns {number} The amount of XP required for the provided level
	 */

	/**
	 * Creates a new Rank Card!
	 * @param {InputData} input The data for the rank card to initialise with
	 * @returns {RankCard}
	 */
	constructor(input) {
		const {
			user: member,
			xpForLevel: xpFor,
			rank,
			level,
			fonts,
			usernameLength,
			stripAccents,
		} = input;

		const parsedUsername = shorten(member.user.username, usernameLength ?? 15);

		// Register fonts provided
		if (fonts && fonts.length > 0) {
			fonts.forEach((font) => {
				Canvas.registerFont(font.path, {
					family: font.family,
					weight: font.weight,
					style: font.style,
				});
			});
		} else {
			Canvas.registerFont(path.join(__dirname, 'assets', 'neutra.otf'), {
				family: 'Neutra',
			});
		}

		/**
		 * Rank card data
		 * @type {CardData}
		 * @private
		 */
		this._data = {
			width: 934,
			height: 282,
			background: {
				type: 'colour',
				value: '#23272a',
			},
			progressBar: {
				rounded: true,
				x: 275.5,
				y: 183.75,
				height: 37.5,
				width: 596.5,
				trackColour: '#484b4e',
				barColour: {
					type: 'colour',
					value: '#ffffff',
				},
			},
			avatar: {
				source: member.user.avatarURL({ format: 'png' }),
				x: 70,
				y: 50,
				height: 180,
				width: 180,
			},
			status: {
				width: 5,
				type: member.presence.status,
				colour: STATUS_COLOURS[member.presence.status],
				circle: false,
			},
			rank: {
				display: rank ? true : false,
				data: rank,
				colour: '#ffffff',
				displayText: 'Rank',
				size: 54,
			},
			level: {
				display: true,
				data: level,
				colour: '#ffffff',
				displayText: 'Level',
				size: 54,
			},
			overlay: {
				display: true,
				alpha: 0.5,
				colour: '#333640',
			},
			currentXP: {
				data: xpFor(level),
				colour: '#ffffff',
				size: 48,
			},
			requiredXP: {
				data: xpFor(level + 1),
				colour: '#ffffff',
				size: 48,
			},
			discriminator: {
				data: member.user.discriminator,
				colour: '#ffffff',
				size: 60,
			},
			username: {
				data: stripAccents ? accents(parsedUsername) : parsedUsername,
				colour: '#ffffff',
				size: 60,
			},
		};
	}

	/**
	 * Calculates the progress the progress bar should be at
	 * @private
	 * @returns {number}
	 */
	_calculateProgress() {
		const cx = this._data.currentXP.data;
		const rx = this._data.requiredXP.data;

		if (rx <= 0) return 1;
		if (cx > rx) return this._data.progressBar.width;

		let width = (cx * 615) / rx;
		if (width > this._data.progressBar.width) width = this._data.progressBar.width;

		return width;
	}

	/**
	 * Sets the background of the rank card!
	 * @param {BackgroundType} type The type of the input
	 * @param {string | Buffer} value The inputted value
	 * @returns {RankCard}
	 */
	setBackground(type, value) {
		this._data.background.type = type;
		this._data.background.value = value;
		return this;
	}

	/**
	 * Sets the overlay of the rank card!
	 * @param {string} colour The colour to make the overlay
	 * @param {number} [level=0.5] The level to make the overlay
	 * @param {boolean} [display=true] Whether the overlay should be displayed anymore
	 * @returns {RankCard}
	 */
	setOverlay(colour, level = 0.5, display = true) {
		this._data.overlay.colour = colour;
		this._data.overlay.display = display;
		this._data.overlay.alpha = level;
		return this;
	}

	/**
	 * Updates data about the progress bar's style!
	 * @param {ProgressType} type The type of the input
	 * @param {string | string[]} value The inputted value
	 * @param {boolean} [rounded=true] Whether the progress bar should be rounded or not
	 * @returns {RankCard}
	 */
	setProgressBar(type, value, rounded = true) {
		this._data.progressBar.barColour.type = type;
		this._data.progressBar.barColour.value = value;
		this._data.progressBar.rounded = rounded;
		return this;
	}

	/**
	 * Update the progress bar's track colour!
	 * @param {string} colour The colour to make the progress bar track!
	 * @returns {RankCard}
	 */
	setProgressBarTrack(colour) {
		this._data.progressBar.trackColour = colour;
		return this;
	}

	/**
	 * Builds the rank card!
	 * @param {BuildFonts} [fonts={bold: 'Neutra', regular: 'Neutra'}] The fonts to build the card with
	 * @returns {Promise<Buffer>}
	 * @async
	 */
	async build(fonts = { bold: 'Neutra', regular: 'Neutra' }) {
		// Create an instance of Canvas
		const canvas = Canvas.createCanvas(this._data.width, this._data.height);
		const ctx = canvas.getContext('2d');

		// Draw the background
		switch (this._data.background.type) {
			case 'image':
				const bg = await Canvas.loadImage(this._data.background.value);
				ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
				break;
			case 'colour':
				ctx.fillStyle = this._data.background.value;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				break;
		}

		// Draw the overlay
		if (this._data.overlay.display) {
			ctx.globalAlpha = this._data.overlay.alpha || 1;
			ctx.fillStyle = this._data.overlay.colour;
			ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
		}

		// Reset transparency
		ctx.globalAlpha = 1;

		// Draw the username
		ctx.font = `${this._data.username.size}px ${fonts.bold}`;
		ctx.fillStyle = this._data.username.colour;

		ctx.fillText(this._data.username.data, 275.5, 160);

		// Draw the discriminator
		ctx.font = `${this._data.discriminator.size}px ${fonts.regular}`;
		ctx.fillStyle = this._data.discriminator.colour;
		ctx.textAlign = 'center';

		ctx.fillText(
			`#${this._data.discriminator.data}`,
			ctx.measureText(this._data.username.data).width + 365,
			160
		);

		// Draw the avatar
		ctx.save();
		ctx.beginPath();
		ctx.arc(135, 145, 100, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		const avatar = await Canvas.loadImage(this._data.avatar.source);
		ctx.drawImage(avatar, 35, 45, this._data.avatar.width + 20, this._data.avatar.height + 20);
		ctx.restore();

		// Draw the status
		if (this._data.status.circle) {
			ctx.beginPath();
			ctx.fillStyle = this._data.status.colour;
			ctx.arc(215, 205, 20, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();
		} else if (!this._data.status.circle) {
			ctx.beginPath();
			ctx.arc(135, 145, 100, 0, Math.PI * 2, true);
			ctx.strokeStyle = this._data.status.colour;
			ctx.lineWidth = this._data.status.width;
			ctx.stroke();
		}

		// Get the progress bar colour ready
		let barColour;

		if (this._data.progressBar.barColour.type === 'gradient') {
			// @ts-ignore
			const gradientContext = ctx.createRadialGradient(this._calculateProgress(), 0, 500, 0);
			this._data.progressBar.barColour.value.forEach((colour, i) =>
				gradientContext.addColorStop(i, colour)
			);
			barColour = gradientContext;
		} else {
			barColour = this._data.progressBar.barColour.value;
		}

		// Draw progress bar and the track
		ctx.beginPath();

		if (this._data.progressBar.rounded) {
			// Draw the track
			ctx.fillStyle = this._data.progressBar.trackColour;
			ctx.arc(275.5, 202.25, 18.5, 1.5 * Math.PI, 0.5 * Math.PI, true);
			ctx.fill();
			ctx.fillRect(275.5, 183.75, 596.5, 37.5);
			ctx.arc(872, 202.25, 18.75, 1.5 * Math.PI, 0.5 * Math.PI, false);
			ctx.fill();

			ctx.beginPath();

			// Draw the bar
			ctx.fillStyle = barColour;
			ctx.arc(275.5, 202.25, 18.5, 1.5 * Math.PI, 0.5 * Math.PI, true);
			ctx.fill();
			ctx.fillRect(275.5, 183.75, this._calculateProgress(), 37.5);
			ctx.arc(275.5 + this._calculateProgress(), 202.25, 18.75, 1.5 * Math.PI, 0.5 * Math.PI, false);
			ctx.fill();
		} else {
			// Draw the bar
			ctx.fillStyle = barColour;
			ctx.fillRect(
				this._data.progressBar.x,
				this._data.progressBar.y,
				this._calculateProgress(),
				this._data.progressBar.height
			);

			// Draw the outline
			ctx.beginPath();
			ctx.strokeStyle = this._data.progressBar.trackColour;
			ctx.lineWidth = 7;
			ctx.strokeRect(
				this._data.progressBar.x,
				this._data.progressBar.y,
				this._data.progressBar.width,
				this._data.progressBar.height
			);
		}

		ctx.textAlign = 'start';

		// Draw the level
		if (this._data.level.display) {
			ctx.font = `${this._data.level.size}px ${fonts.bold}`;
			ctx.fillStyle = this._data.level.colour;
			ctx.fillText(`${this._data.level.displayText} ${abbreviate(this._data.level.data)}`, 275.5, 85);
		}

		// Draw the rank
		if (this._data.rank.display) {
			ctx.save();
			ctx.font = `bold ${this._data.rank.size}px ${fonts.bold}`;
			ctx.fillStyle = this._data.rank.colour;
			ctx.fillText(
				`${this._data.rank.displayText} ${abbreviate(this._data.rank.data)}`,
				815 - ctx.measureText(`${this._data.rank.displayText} ${abbreviate(this._data.rank.data)}`).width,
				85
			);
			ctx.restore();
		}

		// Return the buffer
		return canvas.toBuffer();
	}
}

module.exports.RankCard = RankCard;
