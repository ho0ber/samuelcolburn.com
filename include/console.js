// Eww! Globals!
var st = "";
var cur = 0;
var hist = [];
var histcurs = -1;
var st_temp = "";

// Init the console
$(function() {
  cur = initial_commands(cur)
});

// Handle Backspace, Up, and Down keys
$(document).keydown(function(e) {
  if (e.which == 8) { // backspace
    st = st.substr(0,(st.length -1))
    $('#entry_'+cur).html(st);
    return false;
  } else if (e.which == 38) {
    if (histcurs == -1) {
      st_temp = st;
      histcurs = hist.length-1
    }
    else if (histcurs > 0)
      histcurs--

    st = hist[histcurs]
    $('#entry_'+cur).html(st);
    return false;
  } else if (e.which == 40) {
    if (histcurs >= hist.length -1) {
      histcurs = -1
      st = st_temp
    }
    else if (histcurs >= 0) {
      histcurs++
      st = hist[histcurs]
    }
    $('#entry_'+cur).html(st);
    return false;
  }
});

// Handle normal, printable keys
$(document).keypress(function(e) {
  if (e.which == 13) { // enter
    $('#entry_'+cur).html(st+String.fromCharCode(e.which));
    cur = parse_entry(st, cur)
    st = ""
    window.scrollTo(0,document.body.scrollHeight);
  } else {
    st += String.fromCharCode(e.which);
    $('#entry_'+cur).html(st);
  }
});

// Run a handful of initial commands
function initial_commands(cursor) {
  cursor = run_command("whoami", cursor)
  cursor = run_command("git config --get user.email", cursor)
  cursor = run_command("echo $HOME", cursor)
  cursor = run_command("jobs", cursor)
  cursor = run_command("history", cursor)
  cursor = run_command("ls", cursor)
  cursor = run_command("cat bookmarks.htm", cursor)
  cursor = run_command("cat credit.htm", cursor)
  cursor = run_command("gui --help", cursor)
  return cursor
}

// Run a caommand as if it was typed in
function run_command(input, cursor) {
  $('#entry_'+cursor).html(input+'\n');
  return parse_entry(input, cursor)
}

// Parse input from the console
function parse_entry(input, cursor) {
  if (input != "") hist.push(input)
  histcurs = -1

  var response = "command not found: "+input+"\n\n"
  input_arr = input.split(" ").filter(function(n){ return n != "" })
  if (input_arr[0] == "git") response = "git: access denied for: "+input_arr.splice(1).join(" ")+'\n\n'

  switch(input) {
    case "":
      response = "";
      break;
    case "clear":
      response = "";
      $("#console").html('$ <span id="entry_0"></span><span class="blink_me">_</span>')
      cur = 0;
      return 0;
    case "restart":
      window.location.reload()
      return 0;
    case "gui":
      window.location.href = 'gui';
      return 0;
    case "gui --help":
      response = access_content(".hidden/gui-help", "gui").content
      break;
    case "exit":
      var win = window.open('', '_self');
      window.close();
      win.close();
       // Just in case the above fails to work...
      return run_command("clear", cursor);
    case "ls":
      response = Object.keys(CONTENT).map(function(e) { if (e[0] != ".") return e }).join("  ")+"\n\n";
      break;
    case "ls -a":
      response = Object.keys(CONTENT).join("  ")+"\n\n";
      break;
    case "whoami":
      response = access_content(".hidden/whoami", "whoami").content
      break;
    case "help":
      response = access_content(".hidden/help", "help").content
      break;
    case "history":
      response = access_content(".hidden/history", "history").content
      break;
    case "jobs":
      response = access_content(".hidden/jobs", "jobs").content
      break;
    case "git config --get user.email":
      response = '<a href="mailto:samuel.colburn@gmail.com">samuel.colburn@gmail.com</a>\n\n';
      break;
    case "echo $HOME":
      response = '/USA/Massachusetts/Greater Boston Area/Mansfield\n\n';
      break;
    case "sudo rm -rf /":
      die_horribly()
      break;
    case "reset":
      cursor = run_command("clear", cursor)
      cursor = initial_commands(cursor)
      return cursor;
  }

  switch (input_arr[0]) {
    case "cat":
      response = cat_command(input_arr.splice(1));
      break;
    case "ls":
      response = ls_command(input_arr.splice(1));
      break;
  }

  newcur = cursor + 1
  $('#entry_'+cursor).after( '<span class="response" id="response_'+cursor+'">'+response+'</span>' )
  $('#response_'+cursor).after( '$ <span class="entry" id="entry_' + newcur + '">')
  return newcur
}

// Handle 'cat' command calls
function cat_command(args) {
  if (args.length > 0) {
    result = access_content(args[0], "cat")
    if (typeof(result) === "string")
      return result
    if ("content" in result)
      return result.content
    return "cat: "+args[0]+": Is a directory\n"
  }
  return "cat: pipe is clogged\n"
}

// Handle 'ls' command calls
function ls_command(args) {
  var flags = ""
  var path = ""
  args.map(function(arg) {
    if (arg[0] == "-") {
      flags = arg.split('')
    } else {
      path = arg
    }
  });

  result = access_content(path, "ls")
  if (typeof(result) === "string")
    return result
  keys = Object.keys(result)
  if (flags.indexOf('a') < 0)
    keys = keys.filter(function(n) { return n[0] != "." })
  if (flags.indexOf('l') >= 0)
    return keys.join("\n")+"\n\n";
  else
    return keys.join("  ")+"\n\n";
}

// Access nested content in content.js
function access_content(path_string, command) {
  var path = path_string.split("/").filter(function(n){ return n != "" })
  var object = CONTENT
  path.map(function(key) {
    if (key in object)
      object = object[key]
    else
      return command+": "+path_string+": No such file or directory\n"
  });
  return object
}

function die_horribly() {
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !@#$%^&*()_+-=[]{}|;:,<.>/?";
  var blinders = ["10", "13", "08"]
  var text
  var addtext
  var addchar
  $("#console").html('<span class="blind_me"></span>')
   for( var j=0; j < 100; j++ ) {
    text = ""
    for( var i=0; i < Math.floor(Math.random() * 500)+100; i++ ) {
      addtext = ""
      addchar = possible.charAt(Math.floor(Math.random() * possible.length))
      if (addchar != '\n')
        addtext += '<span class="blind_me_'+blinders[Math.floor(Math.random() * blinders.length)]+'">'+possible.charAt(Math.floor(Math.random() * possible.length))+'</span>'
      else
        addtext += addchar
      text += addtext;
    }
    $(".blind_me").last().after('<span class="blind_me">'+text+'\n</span>')
  }
}
