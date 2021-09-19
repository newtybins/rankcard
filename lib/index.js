const Canvas = require('canvas');
const abbreviate = require('number-abbreviate');
const accents = require('accents');
const path = require('path');
const { GuildMember } = require('discord.js');

const STATUS_COLOURS = {
	online: '#43b581',
	idle: '#faa61a',
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
	 * 
	 * @property {string} bold The font to use for bold text
	 * @property {string} regular The font to use for regular text
	 */

	/**
	 * A font to register with Canvas for usage during building.
	 * @typedef {Object} Font
	 * 
	 * @property {string} path The path to the font file
	 * @property {string} family The name of the font family to register it under
	 * @property {string} [weight] The weight of the font
	 * @property {string} [style] The style of the font
	 */

	/**
	 * Calculates the amount of XP for a level.
	 * @callback XPForLevel
	 * 
	 * @param {number} level The level to calculate the amount of XP for
	 * @returns {number} The amount of XP required for the provided level
	 */

	/**
	 * Input to generate the Rank Card with.
	 * @typedef {Object} InputData
	 * 
	 * @property {number} level The level of the user the rank card is being generated for
	 * @property {XPForLevel} xpForLevel A function that calculates the amount of XP per level
	 * @property {GuildMember} user The user to generate the rank card for
	 * @property {number} [rank] The rank of the user
	 * @property {Font[]} [fonts] The fonts to register for usage during building
	 * @property {number} [usernameLength] The length to shorten the username to
	 * @property {boolean} [stripAccents] Whether accents should be stripped from the username or not
	 */

	/**
	 * Pieces exposed by the library. This can be:
	 * * 'progress'
	 * * 'avatar'
	 * * 'status'
	 * * 'overlay'
	 * * 'level'
	 * * 'rank'
	 * * 'tag'
	 * @typedef {string} Pieces
	 */

	/**
	 * Internal type to represent a piece of data.
	 * @typedef {Object} Piece
	 * 
	 * @property {T} value The piece of data
	 * @property {string} fontColour The colour to render the data with
	 * @property {number} fontSize The font size in pixels to render the data at
	 * @property {boolean} display Whether the piece should be displayed or not
	 * 
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
	 * 
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
	 * Level progress data.
	 * @typedef {Object} Progress
	 * 
	 * @property {boolean} display Whether any progress related data should be displayed
	 * @property {number} currentXP The current amount of XP the user has
	 * @property {number} requiredXP The amount of XP required for the next level
	 * @property {number} fontSize The size of the font for the data
	 * @property {string} fontColour The colour for the progress font
	 * @property {number} x The x coordinate
	 * @property {number} y The y coordinate
	 * @property {number} height The height in pixels
	 * @property {number} width The width in pixels
	 * 
	 * @property {Object} bar Progress bar data
	 * @property {boolean} bar.rounded Whether or not the progress bar is rounded
	 * @property {string} bar.trackColour The colour of the bar's track
	 * @property {number} bar.radius The radius to use if the bar is rounded
	 * 
	 * @property {Object} bar.colour
	 * @property {ProgressType} bar.colour.type The type of the input. Can be one of 'colour' or 'gradient'.
	 * @property {string | string[]} bar.colour.value The value of the input. If 'colour', string. If 'gradient', string[].
	 */

	/**
	 * Status data.
	 * @typedef {Object} Status
	 * 
	 * @property {boolean} display Whether the status should be displayed
	 * @property {number} width The width of the line
	 * @property {PresenceStatus} type The status of the user
	 * @property {string} colour The colour of the status
	 * @property {boolean} circle Whether the status should display in a small circle rather than a ring
	 */

	/**
	 * Overlay data.
	 * @typedef {Object} Overlay
	 * 
	 * @property {boolean} display Whether the overlay should be displayed
	 * @property {number} opacity The alpha/opacity value of the overlay
	 * @property {string} colour The colour of the overlay
	 */

	/**
	 * Avatar data.
	 * @typedef {Object} Avatar
	 * 
	 * @property {string | Buffer} value The value of the avatar
	 * @property {boolean} display Whether the avatar should be displayed or not
	 * @property {number} x The x coordinate
	 * @property {number} y The y coordinate
	 * @property {number} height The height in pixels
	 * @property {number} width The width in pixels
	 * @property {number} radius The radius to use
	 */
	
	/**
	 * Tag data.
	 * @typedef {Object} Tag
	 *
	 * @property {boolean} display Whether the tag should be displayed
	 * @property {number} fontSize The size of the font for the data
	 * @property {string} fontColour The colour for the prog
	 * @property {string} username The user's username
	 * @property {string} discriminator The user's discriminator
	 */

	/**
	 * Internal data used by the builder to render cards.
	 * @typedef {Object} CardData
	 * 
	 * @property {number} width The width of the card
	 * @property {number} height The height of the card
	 * @property {Background} background Data about the background of the card
	 * @property {Progress} progress Data about the progress through the level
	 * @property {Status} status Data about the status
	 * @property {Overlay} overlay Data about the overlay
	 * @property {Piece<number>} rank Data about the user's rank
	 * @property {Piece<number>} level Data about the user's level
	 * @property {Avatar} avatar Data about the user's avatar
	 * @property {Tag} tag Data about the user's tag
	 */

	/**
	 * Creates a new Rank Card!
	 * @param {InputData} input The data for the rank card to initialise with
	 * @returns {RankCard}
	 */
	constructor(input) {
		const { user: member } = input;
		
		// Parse the username
		let username = shorten(member.user.username, input.usernameLength ?? 15);

		if (input.stripAccents) {
			username = accents(username);
		}

		// Register fonts provided
		if (input.fonts && input.fonts.length > 0) {
			input.fonts.forEach((font) => {
				Canvas.registerFont(font.path, {
					family: font.family,
					weight: font.weight,
					style: font.style,
				});
			});
		} else {
			// Regular & Bold
			Canvas.registerFont(path.join(__dirname, '..', 'assets', 'neutra.otf'), {
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
			progress: {
				display: true,
				currentXP: input.xpForLevel(input.level),
				requiredXP: input.xpForLevel(input.level + 1),
				fontSize: 42,
				fontColour: '#ffffff',
				x: 275,
				y: 154,
				height: 37.5,
				width: 580,
				bar: {
					rounded: true,
					trackColour: '#484b4e',
					colour: {
						type: 'colour',
						value: '#ffffff',
					},
					radius: 18.5
				}
			},
			avatar: {
				value: member.user.avatarURL({ format: 'png' }),
				display: true,
				x: 35,
				y: 45,
				height: 180,
				width: 180,
				radius: 100
			},
			status: {
				display: true,
				width: 5,
				type: member.presence.status,
				colour: STATUS_COLOURS[member.presence.status],
				circle: false,
			},
			overlay: {
				display: true,
				opacity: 0.5,
				colour: '#333640',
			},
			level: {
				value: input.level,
				fontColour: '#ffffff',
				fontSize: 42,
				display: true
			},
			rank: {
				value: input.rank,
				fontColour: '#ffffff',
				fontSize: 42,
				display: input.rank ? true : false,
			},
			tag: {
				display: true,
				fontColour: '#ffffff',
				fontSize: 48,
				username,
				discriminator: member.user.discriminator,
			}
		};
	}

	/**
	 * Builds the rank card!
	 * @param {BuildFonts} [fonts={regular: 'Neutra', bold: 'Neutra'}] The fonts to build the card with
	 * @returns {Promise<Buffer>}
	 * @async
	 */
	 async build(fonts = { regular: 'Neutra', bold: 'Neutra' }) {
		// Define constants used in the code regardless of display
		const progressText = `${abbreviate(this._data.progress.currentXP)}/${abbreviate(this._data.progress.requiredXP)}`;

		// Create an instance of Canvas
		const canvas = Canvas.createCanvas(this._data.width, this._data.height);
		const ctx = canvas.getContext('2d');
		ctx.textAlign = 'start';

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
			ctx.globalAlpha = this._data.overlay.opacity || 1;
			ctx.fillStyle = this._data.overlay.colour;
			ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

			// Reset transparency
			ctx.globalAlpha = 1;
		}

		// Draw the user's tag
		if (this._data.tag.display) {
			const tag = `${this._data.tag.username}#${this._data.tag.discriminator}`;
			ctx.font = `bold ${this._data.tag.fontSize}px ${fonts.bold}`;
			ctx.fillStyle = this._data.tag.fontColour;

			ctx.fillText(tag, this._data.progress.x + 10, this._data.progress.y);
		}

		// Draw the avatar
		if (this._data.avatar.display) {
			ctx.save();
			ctx.beginPath();
			ctx.arc(this._data.avatar.x + this._data.avatar.radius, this._data.avatar.y + this._data.avatar.radius, this._data.avatar.radius, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();

			const avatar = await Canvas.loadImage(this._data.avatar.value);
			ctx.drawImage(avatar, this._data.avatar.x, this._data.avatar.y, this._data.avatar.width + 20, this._data.avatar.height + 20);
			ctx.restore();
		}

		// Draw the status
		if (this._data.status.display) {
			if (this._data.status.circle) {
				ctx.beginPath();
				ctx.fillStyle = this._data.status.colour;
				ctx.arc(215, 205, 20, 0, 2 * Math.PI);
				this._data.avatar.x + this._data.avatar.radius, this._data.avatar.y + this._data.avatar.radius, this._data.avatar.radius
				ctx.fill();
				ctx.closePath();
			} else if (!this._data.status.circle) {
				ctx.beginPath();
				ctx.arc(this._data.avatar.x + this._data.avatar.radius, this._data.avatar.y + this._data.avatar.radius, this._data.avatar.radius, 0, Math.PI * 2, true);
				ctx.strokeStyle = this._data.status.colour;
				ctx.lineWidth = this._data.status.width;
				ctx.stroke();
			}
		}

		if (this._data.progress.display) {
			// Get the progress bar colour ready
			let barColour;

			if (this._data.progress.bar.colour.type === 'gradient') {
				const gradientContext = ctx.createRadialGradient(this._calculateProgress(), 0, 500, 0);
				this._data.progress.bar.colour.value.forEach((colour, i) =>
					gradientContext.addColorStop(i, colour)
				);
				barColour = gradientContext;
			} else {
				barColour = this._data.progress.bar.colour.value;
			}

			// Draw progress bar and the track
			ctx.beginPath();

			if (this._data.progress.bar.rounded) {
				// Draw the track
				ctx.fillStyle = this._data.progress.bar.trackColour;
				ctx.arc(this._data.progress.x + this._data.progress.bar.radius, this._data.progress.y + this._data.progress.bar.radius + (this._data.progress.height - 1.25), this._data.progress.bar.radius, 1.5 * Math.PI, 0.5 * Math.PI, true);
				ctx.fill();
				ctx.fillRect(this._data.progress.x + this._data.progress.bar.radius, this._data.progress.y + (this._data.progress.height - 1.25), (1.03101424979 * this._data.progress.width) - this._data.progress.bar.radius, this._data.progress.height);
				ctx.arc(this._data.progress.x + (1.03101424979 * this._data.progress.width), this._data.progress.y + this._data.progress.bar.radius + (this._data.progress.height - 1.25), this._data.progress.bar.radius + 0.25, 1.5 * Math.PI, 0.5 * Math.PI, false);
				ctx.fill();

				ctx.beginPath();

				// Draw the bar
				ctx.fillStyle = barColour;
				ctx.arc(this._data.progress.x + this._data.progress.bar.radius, this._data.progress.y + this._data.progress.bar.radius + (this._data.progress.height - 1.25), this._data.progress.bar.radius, 1.5 * Math.PI, 0.5 * Math.PI, true);
				ctx.fill();
				ctx.fillRect(this._data.progress.x + this._data.progress.bar.radius, this._data.progress.y + (this._data.progress.height - 1.25), this._calculateProgress(), this._data.progress.height);
				ctx.arc(this._data.progress.x + this._data.progress.bar.radius + this._calculateProgress(), this._data.progress.y + this._data.progress.bar.radius + (this._data.progress.height - 1.25), this._data.progress.bar.radius + 0.25, 1.5 * Math.PI, 0.5 * Math.PI, false);
				ctx.fill();
			} else {
				// Draw the bar
				ctx.fillStyle = barColour;
				ctx.fillRect(
					this._data.progress.x,
					this._data.progress.y,
					this._calculateProgress(),
					this._data.progress.height
				);

				// Draw the outline
				ctx.beginPath();
				ctx.strokeStyle = this._data.progress.bar.trackColour;
				ctx.lineWidth = 7;
				ctx.strokeRect(
					this._data.progress.x,
					this._data.progress.y,
					this._data.progress.width,
					this._data.progress.height
				);
			}

			// Show progress
			ctx.font = `${this._data.progress.fontSize}px ${fonts.regular}`;
			ctx.fillStyle = this._data.progress.fontColour;

			ctx.fillText(progressText, this._data.progress.x + this._data.progress.width - ctx.measureText(progressText).width - 10, this._data.progress.y);
		}

		ctx.save();

		// Draw the level
		if (this._data.level.display) {
			ctx.font = `${this._data.level.fontSize}px ${fonts.regular}`;
			ctx.fillStyle = this._data.level.fontColour;

			ctx.fillText(`Level ${abbreviate(this._data.level.value)}`, this._data.progress.x + 10, this._data.progress.y - 75);
		}

		// Draw the rank
		if (this._data.rank.display) {
			ctx.font = `${this._data.rank.fontSize}px ${fonts.regular}`;
			ctx.fillStyle = this._data.rank.fontColour;

			ctx.fillText(
				`Rank ${abbreviate(this._data.rank.value)}`,
				this._data.progress.x + this._data.progress.width - ctx.measureText(progressText).width - 10,
				this._data.progress.y - 75
			);
		}

		ctx.restore();

		// Return the buffer
		return canvas.toBuffer();
	}

	/**
	 * Calculates the progress the progress bar should be at
	 * @private
	 * @returns {number}
	 */
	_calculateProgress() {
		return (this._data.progress.currentXP / this._data.progress.requiredXP) * this._data.progress.width;
	}

	/**
	 * Toggles the display of a piece of data!
	 * @param {...Pieces} pieces The piece(s) to show/hide
	 * @returns {RankCard}
	 */
	toggleDisplay(...pieces) {
		pieces.forEach(piece => this._data[piece].display = !this._data[piece].display);
		return this;
	}

	/**
	 * Edits data about the card's progress piece.
	 * @param {string} fontColour The colour to make the progress font
	 * @param {number} [fontSize] The size to make the progress font
	 * @returns {RankCard}
	 */
	setProgress(fontColour, fontSize = this._data.progress.fontSize) {
		this._data.progress.fontColour = fontColour ?? this._data.progress.fontColour;
		this._data.progress.fontSize = fontSize ?? this._data.progress.fontSize;
		return this;
	}

	/**
	 * Edits data about the card's progress bar piece.
	 * @param {BarColour} colour The colour to make the progress bar
	 * @param {string} [trackColour] The colour to make the progress bar's track
	 * @param {boolean} [rounded] Whether the progress bar should be rounded or not
	 * @returns {RankCard}
	 */
	setProgressBar(colour, trackColour = this._data.progress.bar.trackColour, rounded = this._data.progress.bar.rounded) {
		this._data.progress.bar.colour.type = colour.type ?? this._data.progress.bar.colour.type;
		this._data.progress.bar.colour.value = colour.value ?? this._data.progress.bar.colour.value;

		this._data.progress.bar.trackColour = trackColour ?? this._data.progress.bar.trackColour;
		this._data.progress.bar.rounded = rounded ?? this._data.progress.bar.rounded;
		return this;
	}

	/**
	 * Edits data about the card's status piece.
	 * @param {boolean} circle Whether the status should be rendered as a circle
	 * @returns {RankCard}
	 */
	setStatus(circle) {
		this._data.status.circle = circle ?? this._data.status.circle;
		return this;
	}

	/**
	 * Edits data about the card's overlay piece.
	 * @param {string} colour The colour the overlay should be
	 * @param {number} [opacity] The opacity of the overlay
	 * @returns {RankCard}
	 */
	setOverlay(colour, opacity = this._data.overlay.opacity) {
		this._data.overlay.colour = colour ?? this._data.overlay.colour;
		this._data.overlay.opacity = opacity ?? this._data.overlay.opacity;
		return this;
	}

	/**
	 * Edits data about the card's level piece.
	 * @param {string} fontColour The colour the level's font should be
	 * @param {number} [fontSize] The size the level's font should be
	 * @returns {RankCard}
	 */
	setLevel(fontColour, fontSize) {
		this._data.level.fontColour = fontColour ?? this._data.level.fontColour;
		this._data.level.fontSize = fontSize ?? this._data.level.fontSize;
		return this;
	}

	/**
	 * Edits data about the card's rank piece.
	 * @param {string} fontColour The colour the rank's font should be
	 * @param {number} [fontSize] The size the rank's font should be
	 * @returns {RankCard}
	 */
	setRank(fontColour, fontSize) {
		this._data.rank.fontColour = fontColour ?? this._data.rank.fontColour;
		this._data.rank.fontSize = fontSize ?? this._data.rank.fontSize;
		return this;
	}

	/**
	 * Edits data about the card's tag piece.
	 * @param {string} fontColour The colour the tag's font should be
	 * @param {number} [fontSize] The size the tag's font should be
	 * @returns {RankCard}
	 */
	 setTag(fontColour, fontSize) {
		this._data.tag.fontColour = fontColour ?? this._data.tag.fontColour;
		this._data.tag.fontSize = fontSize ?? this._data.tag.fontSize;
		return this;
	}
}

module.exports.RankCard = RankCard;
