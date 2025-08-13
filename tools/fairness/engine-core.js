/**
 * engine-core.js
 * Shared hysteresis (Option F) state transition logic for fairness engine & runtime harness.
 * Exports decide() pure function for unit testing. Does not perform I/O.
 */
export function decide(params, prevState, ratio){
  const p = params;
  const state = prevState?.state || 'NONE';
  const consecutive = prevState?.consecutive || 0;
  const cooldownLeft = prevState?.cooldownLeft || 0; // raw prior value
  const stallConsecPrev = prevState?.stallConsec || 0;
  let newState = state; let newConsec = consecutive; let newCooldown = cooldownLeft; const events=[];
  let stallConsec = stallConsecPrev;
  const severe = ratio < p.T_enter_major;
  const borderline = ratio < p.T_enter_standard && ratio >= p.T_enter_major;
  const inStallBand = ratio >= p.stalled_min_ratio && ratio < p.stalled_max_ratio_below_exit;

  switch(state){
    case 'NONE':
      stallConsec = 0;
      if (severe){ newState='ACTIVE'; events.push({type:'ENTER',reason:'severe'}); }
      else if (borderline){ newState='CANDIDATE'; newConsec=1; }
      break;
    case 'CANDIDATE':
      stallConsec = 0;
      if (severe){ newState='ACTIVE'; events.push({type:'ENTER',reason:'severe'}); }
      else if (borderline){ newConsec+=1; if (newConsec >= p.consecutive_required_standard){ newState='ACTIVE'; events.push({type:'ENTER',reason:'consecutive'});} }
      else { newState='NONE'; newConsec=0; }
      break;
    case 'ACTIVE': {
      if (ratio >= p.T_exit){
        newState='CLEARED'; newCooldown=p.cooldown_snapshots_after_exit; stallConsec=0; events.push({type:'EXIT'});
      } else {
        // Track potential stall band accumulation
        if (inStallBand){
          stallConsec += 1;
          if (stallConsec >= p.stalled_window_snapshots){
            newState='STALLED'; events.push({type:'STALL', window:stallConsec});
          }
        } else {
          stallConsec = 0; // reset if outside band
        }
      }
      break; }
    case 'STALLED': {
      if (ratio >= p.T_exit){
        newState='CLEARED'; newCooldown=p.cooldown_snapshots_after_exit; stallConsec=0; events.push({type:'EXIT'});
      } else if (!inStallBand){
        // Stall broken. If severe or borderline rules would normally apply we re-evaluate as ACTIVE baseline
        stallConsec = 0;
        if (severe){
          newState='ACTIVE'; events.push({type:'STALL_BREAK',reason:'severe'});
        } else if (borderline){
          // borderline after stall -> treat as still ACTIVE candidate progression not needed; remain ACTIVE
          newState='ACTIVE'; events.push({type:'STALL_BREAK',reason:'borderline'});
        } else {
          // moved outside stall band upward but not exited (still below T_exit) => remain ACTIVE
          newState='ACTIVE'; events.push({type:'STALL_BREAK',reason:'drift'});
        }
      }
      break; }
    case 'CLEARED':
      stallConsec = 0;
      if (severe){ newState='ACTIVE'; events.push({type:'REENTER',reason:'severe'}); }
      else if (cooldownLeft===0 && borderline){ newState='CANDIDATE'; newConsec=1; }
      break;
  }
  // Decrement cooldown after evaluating transitions unless state changed to CLEARED this tick (fresh exit)
  if (newState==='CLEARED' && state!=='CLEARED') {
    newCooldown = p.cooldown_snapshots_after_exit; // freshly set above already
  } else if (newCooldown>0 && newState==='CLEARED') {
    newCooldown = newCooldown-1; // consume one interval while stabilized in CLEARED
  } else if (newState!=='CLEARED') {
    // not in CLEARED -> cooldown not relevant, keep as-is (or zero if negative)
  }
  return { state:newState, consecutive:newConsec, cooldownLeft:newCooldown, stallConsec, events };
}
