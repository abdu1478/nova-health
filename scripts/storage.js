export default class Storage {
  static getWorkouts() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    return data || [];
  }

  static saveWorkouts(workouts) {
    localStorage.setItem('workouts', JSON.stringify(workouts));
  }
}
