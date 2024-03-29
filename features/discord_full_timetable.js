const ms_min = 1000 * 60

const Discord = require('discord.js')
const { Command , Commands} = require('../commands')
const { auto_del_time } = require('../adt')
const { Timetable , Subject , date_to_str } = require('../timetable-js')

const days = [
  [['อา', 'อาทิตย์', 'sun', 'sunday'], 'sunday', 'วันอาทิตย์'],
  [['จ', 'จันทร์', 'mon', 'monday'], 'monday', 'วันจันทร์'],
  [['อ', 'อังคาร', 'tue', 'tuesday'], 'tuesday', 'วันอังคาร'],
  [['พ', 'พุธ', 'wed', 'wednesday'], 'wednesday', 'วันพุธ'],
  [['พฤ', 'พฤหัส', 'พฤหัสบดี', 'thu', 'thursday'], 'thursday', 'วันพฤหัสบดี'],
  [['ศ', 'ศุกร์', 'fri', 'friday'], 'friday', 'วันศุกร์'],
  [['ส', 'เสาร์', 'sat', 'satureday'], 'satureday', 'วันเสาร์']
]

const tomorrow = ['tmr', 'tomorrow', 'พน', 'พ.น']



class EmbedTimetable extends Command {

  /**
   * 
   * @param {TimeTable} timetable 
   * @param {string} name 
   * @param {MessageCallback[]} filter 
   */
  constructor(timetable , name, filter) {
    super(name, undefined, filter)
    this.timetable = timetable
  }

  callback = async (message, args) => {

    let cur_date = new Date()
    let day = args[1] === undefined ? days[cur_date.getDay()] : days.find(v => v[0].find(x => x === args[1]) !== undefined)

    if (tomorrow.find(v => v === args[1]) !== undefined) {
      day = days[cur_date.getDay() === 6 ? 0 : cur_date.getDay() + 1]
    }

    if (day === undefined)
      throw `day === undefined ${args[1]}`

    let timetable = this.timetable.is_weekend(day[1]) ? ['weekend'] : this.timetable.timetable[day[1]]
    
    let values = ['' , '' ,'']
    timetable.forEach( (v , i) => {
      values[0] += `${i+1}. ${i<10?" ":""}${v.code}\n`
      values[1] += v.name + '\n'
      values[2] += `${ date_to_str(this.timetable.get_period_start(i,timetable)) }/${date_to_str(this.timetable.get_period_end(i,timetable))}\n`
    })
    
    const embed = new Discord.MessageEmbed()
    .addFields( [
      {
        "name" : "คาบ. รหัสวิชา" , 
        "value" : values[0],
        "inline" : true
      },
      {
        "name" : "ชื่อวิชา" , 
        "value" : values[1],
        "inline" : true
      
      },
      {
        "name" : "เริ่ม/จบ" , 
        "value" : values[2],
        "inline" : true
      }
    ])

    message.channel.send( {
      content : "#" , 
      embed : embed
    })

    console.log(values)
  }

}

class TextTimetable extends Command {

  /**
   * 
   * @param {TimeTable} timetable 
   * @param {string} name 
   * @param {MessageCallback[]} filter 
   */
  constructor(timetable,name, filter) {
    super(name, undefined, filter)
    this.timetable = timetable
  }

  callback = async (message, args) => {

    let cur_date = new Date()
    let day = args[1] === undefined ? days[cur_date.getDay()] : days.find(v => v[0].find(x => x === args[1]) !== undefined)

    if (tomorrow.find(v => v === args[1]) !== undefined) {
      day = days[cur_date.getDay() === 6 ? 0 : cur_date.getDay() + 1]
    }

    if (day === undefined)
      throw `day === undefined ${args[1]}`

    if ( this.timetable.is_weekend(day[1])) {

    }

    let timetable = this.timetable.is_weekend(day[1]) ? weekend_subjects : this.timetable._TimeTable[day[1]]
    let colums = []

    /* 
    * because length count 'every' character . we need to remove all the merge char.
    * tf is merge char lol
    * examples
    * - 'ดี' is 2 char but virtually 1 char because -ี doesn't take a seperate space
    */
    var thai_virtual_fix = (text) => { 
      const sp_char = [
          '\u0E31', 
          '\u0E34',
          '\u0E35',
          '\u0E36',
          '\u0E37',
          '\u0E38',
          '\u0E39',
          '\u0E3A',
          '\u0E47',
          '\u0E48',
          '\u0E49',
          '\u0E4A',
          '\u0E4B',
          '\u0E4C',
          '\u0E4D',
          '\u0E4E',
          '\u0E4F'
      ]
      sp_char.forEach( v => {
          text = text.replaceAll(v,'')
      })
      return text
  }

  
    timetable.forEach((v, i) => {
      const subject = this.timetable.get_subject_safe(v);
      let date_str = date_to_str(TimeTable.get_period_start(i)) + '/' + date_to_str(TimeTable.get_period_end(i))
       
      colums.push( [
        [subject.code ,subject.code ],
        [subject.name ,thai_virtual_fix(subject.name) ],
        [date_str ,date_str]
      ])

    })

    let maxes = [0,0,0]
    
    colums.forEach(v => {
      v.forEach((t, i) => {
        if (t[1].length > maxes[i])
          maxes[i] = t[1].length
      })
    })

    let buffer = ''
    
    colums.forEach(v => {

      let bufs = [
        (new Array( (maxes[0] - v[0][1].length) + 1 ) ).fill(' ').join(''),
        (new Array( (maxes[1] - v[1][1].length) + 1 ) ).fill(' ').join(''),
        (new Array( (maxes[2] - v[2][1].length) + 1 ) ).fill(' ').join('')
      ]
      let selected = [
        [
          (new Array( (maxes[0]) + 1 ) ).fill('v').join(''),
          (new Array( (maxes[1]) + 1 ) ).fill('v').join(''),
          (new Array( (maxes[2]) + 1 ) ).fill('v').join('')
        ],
        [
          (new Array( (maxes[0]) + 1 ) ).fill('^').join(''),
          (new Array( (maxes[1]) + 1 ) ).fill('^').join(''),
          (new Array( (maxes[2]) + 1 ) ).fill('^').join('')
        ]  
      ]
     
      if (args[1] === undefined && v[0][0] == this.timetable.get_current_subject_code()) {
        buffer = buffer + `- ${selected[0][0]} ${selected[0][1]} ${selected[0][2]} \n`
        buffer = buffer + `+ ${v[0][0]}${bufs[0]} ${v[1][0]}${bufs[1]} ${v[2][0]}${bufs[2]} \n`
        buffer = buffer + `- ${selected[1][0]} ${selected[1][1]} ${selected[1][2]} \n`
        return
      }
    
      buffer = buffer + `+ ${v[0][0]}${bufs[0]} ${v[1][0]}${bufs[1]} ${v[2][0]}${bufs[2]} \n`
    })


    buffer = `+ [ ตารางเรียน${day[2]} ] \n`  + buffer
    

    console.log(buffer)
   
    this.last_mesage = await message.channel.send({
      content : `\`\`\`diff\n${buffer}\n\`\`\``
    }).then(auto_del_time(ms_min*5))
    
  }
}

/**
 * 
 * @param {Commands} cmds 
 * @param {MessageCallback} filters who can use these debug commands
 */
var add_debug_commands = (cmds , filters) => {
  // lol what
  
}


module.exports = {
  EmbedTimetable,
  TextTimetable,
  add_debug_commands,
  date_to_str
}